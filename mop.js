(function () {
    setTimeout(function () {
        var empId = .......;
        var inTotalTimeDiv = $("#inTotalTime");
        var inMonthTotalTimeDiv = $("#inMonthTotalTime");

        if (inTotalTimeDiv.length == 0) {
            inTotalTimeDiv = $('<div id="inTotalTime" style="text-align:left;" />');
            inTotalTimeDiv.appendTo("#scannersControl");
        }

        if (inMonthTotalTimeDiv.length == 0) {
            inMonthTotalTimeDiv = $('<div id="inMonthTotalTime" style="padding-top: 10px; line-height: 1.5; font-weight: bold;" />');
            inMonthTotalTimeDiv.appendTo("#datepicker");

        }

        var TotalTime = (function () {
            function TotalTime() {
                this.value = null;
            }

            TotalTime.prototype.add = function (from, to) {
                if (this.value == null) {
                    this.value = to.subtract(from)
                }

                else {
                    this.value.add(to.subtract(from));
                }
            }

            TotalTime.prototype.getValue = function () {
                return this.value;
            }

            return TotalTime;
        })();

        function pad(str, max) {
            str = str.toString();
            return str.length < max ? pad("0" + str, max) : str;
        }

        function dayClickCalculate() {
            var date = moment($("#datepicker").datepicker('getDate')).format('YYYY-MM-DD');

            calculateInTime(date, function (total) {
                inTotalTimeDiv.text(total.getValue() != null ? total.getValue().format("HH:mm:ss") : '');
            });
        }

        function calculateInTime(date, callback) {
            $.get('Scanners/GetDataFromScanners?date=' + date + '&userId=' + empId, function (data) {
                var isIn = false;
                var total = new TotalTime();
                var enter = null;
                var exit = null;

                data.forEach(function (item) {
                    if (item.Enter == "WE" && !isIn) {
                        enter = moment(item.Date);
                        isIn = true;
                    }
                    else if (item.Enter == "WY" && isIn) {
                        isIn = false;
                        exit = moment(item.Date);

                        total.add(enter, exit);
                    }
                })

                // Niebyło wyjścia (obecny dzień)
                if (isIn) {
                    total.add(enter, moment());
                }

                callback(total);
            });
        }
		
		function getMinutes(hours, minutes){
			return hours * 60 + minutes;                        
		}

		function minToHours(minutes){
			 return (minutes < 0 ? -1 : 1) * Math.floor(Math.abs(minutes / 60));
		}
		
		function minToHourMin(minutes){
			return minutes % 60;
		}
		
        function showResult(avgMinutes, missingMin, minutes, days, weekendsMin, todayMin) {
			var hours_all = minToHours(minutes);
            var minutes_all = minToHourMin(minutes);
						
            var hours_brak = minToHours(missingMin);
            var minutes_brak = minToHourMin(missingMin);

            var hours_weekends = minToHours(weekendsMin);
            var minutes_weekends = minToHourMin(weekendsMin);
			
			var hours_today = minToHours(todayMin);
            var minutes_today = minToHourMin(todayMin);
			
			// missingMin + ' minut'
			
            inMonthTotalTimeDiv.html(
				  '<span style="font-size: 10px;color:gray;">Calculation</span>'
				+ '<div style="border: 1px solid gray;width: 400px; padding: 3px;">'
				+ 'Czas: ' + hours_all + ' h ' + minutes_all + ' min'
                + '<br />Dni: ' + days+ ''
                + '<br /><br />Dzienna średnia: ' + moment({h: parseInt(avgMinutes / 60, 10), m: (avgMinutes - (parseInt(avgMinutes / 60, 10) * 60))}).format("HH \\h mm \\min")
                + (weekendsMin > 0 ? '<br />Weekends: ' + hours_weekends + ' h ' + minutes_weekends + ' min' : '')
				+ (todayMin > 0 ? '<br /><i style="color: gray;">Dziś w pracy: ' + hours_today + ' h ' + minutes_today + ' min </i>' : '')
                + '<br /><br />Brakuje: <span style="color: '+(missingMin > 0 ? 'red' : 'green')+';" title="' + missingMin + ' min">' + hours_brak + ' h ' + minutes_brak + ' min</span>'
				+ '</div>'
            );
        }


        $(".scannerPresence").click(function () {
            dayClickCalculate();
        });

        $(".ui-datepicker-week-end").click(function () {
            dayClickCalculate();
        });

        //$("#datepicker").datepicker('setDate', new Date());

        dayClickCalculate();

        // Cały mc
        function monthCalculate() {
            var days = 0;
            var minutes = 0;
            var missingMin = 0;
            var weekendsMin = 0;
            var todayMin = 0 ;
            $("#datepicker .scannerPresence").each(function (i, d) {
                var $dayTr = $(d);
                var day = moment({y: $dayTr.data('year'), M: $dayTr.data('month'), d: $dayTr.children('a').first().text()});                

                calculateInTime(day.format('YYYY-MM-DD'), function (total) {
                    ++days;
                    // Todo: to wyciągnąć wyżej i dać urlopy jeszcze nieobecności brak karty itp.                
                    if (total != null) {
						if(total.getValue().date()==new Date().getDate()){
							todayMin = getMinutes(total.getValue().hours(), total.getValue().minutes());
						}
                        minutes += getMinutes(total.getValue().hours(), total.getValue().minutes());
						
                        var avgMinutes = parseInt(minutes / days);
                        missingMin = (days * 8 * 60) - minutes;
                        showResult(avgMinutes, missingMin, minutes, days, weekendsMin, todayMin);
                    }
                })
            });
            $("#datepicker .ui-datepicker-week-end").each(function (i, d) {
                var $dayTr = $(d);
                var day = moment({y: $dayTr.data('year'), M: $dayTr.data('month'), d: $dayTr.children('a').first().text()});                

                calculateInTime(day.format('YYYY-MM-DD'), function (total) {
                    if (total != null && total.getValue() != null) {
                        minutes += getMinutes(total.getValue().hours(), total.getValue().minutes());
                        var avgMinutes = parseInt(minutes / days);
                        weekendsMin = weekendsMin + total.getValue().hours() * 60 + total.getValue().minutes();
                        missingMin = missingMin - minutes;
                        showResult(avgMinutes, missingMin, minutes, days, weekendsMin, todayMin);
                    }
                })
            });
        }

        monthCalculate();
    }, 800);
})();

