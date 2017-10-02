(function () {
    setTimeout(function () {
        var empId = ........;//You have to get your ID from chrome web developer mode [F12]
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

        function showResult(avgMinutes, brakuje, minutes, days, weekendsMinutes) {
            var hours_brak = (brakuje < 0 ? -1 : 1) * Math.floor(Math.abs(brakuje / 60));
            var minutes_brak = brakuje % 60;

            var hours_weekends = (weekendsMinutes < 0 ? -1 : 1) * Math.floor(Math.abs(weekendsMinutes / 60));
            var minutes_weekends = weekendsMinutes % 60;

            inMonthTotalTimeDiv.html(
                'Czas całkowity: ' + parseInt(minutes / 60, 10) + ':' + pad(minutes - (parseInt(minutes / 60, 10) * 60), 2)
                + '<br />Dni: ' + days
                + '<br />Średnia dziennie: ' + moment({h: parseInt(avgMinutes / 60, 10), m: (avgMinutes - (parseInt(avgMinutes / 60, 10) * 60))}).format("HH:mm")
                + '<br />Weekends: ' + hours_weekends + ' h ' + minutes_weekends + ' min'
                + '<br /><br />Brakuje: ' + brakuje + ' minut' + ' => (' + hours_brak + ' h ' + minutes_brak + ' min)'
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
            var brakuje = 0;
            var weekendsMinutes = 0;
            $("#datepicker .scannerPresence").each(function (i, d) {
                var $dayTr = $(d);
                var day = moment({y: $dayTr.data('year'), M: $dayTr.data('month'), d: $dayTr.children('a').first().text()});                

                calculateInTime(day.format('YYYY-MM-DD'), function (total) {
                    ++days;
                    // Todo: to wyciągnąć wyżej i dać urlopy jeszcze nieobecności brak karty itp.                
                    if (total != null) {
                        minutes += total.getValue().hours() * 60;
                        minutes += total.getValue().minutes();

                        var avgMinutes = parseInt(minutes / days);
                        brakuje = (days * 8 * 60) - minutes;
                        showResult(avgMinutes, brakuje, minutes, days, weekendsMinutes);
                    }
                })
            });
            $("#datepicker .ui-datepicker-week-end").each(function (i, d) {
                var $dayTr = $(d);
                var day = moment({y: $dayTr.data('year'), M: $dayTr.data('month'), d: $dayTr.children('a').first().text()});
                calculateInTime(day.format('YYYY-MM-DD'), function (total) {
                    if (total != null && total.getValue() != null) {
                        minutes += total.getValue().hours() * 60;
                        minutes += total.getValue().minutes();
                        var avgMinutes = parseInt(minutes / days);
                        weekendsMinutes = weekendsMinutes + total.getValue().hours() * 60 + total.getValue().minutes();
                        brakuje = brakuje - minutes;
                        showResult(avgMinutes, brakuje, minutes, days, weekendsMinutes);

                    }
                })
            });
        }

        monthCalculate();
    }, 800);
})();

