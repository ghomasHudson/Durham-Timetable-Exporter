
COLUMNS = [null, "desc", null, "start", "end", "duration", "room", "staff", "weeks", "plannedSize"];

if (window.location.pathname === "/module.htm") {
  var style = $("select[name*='style']");
  style.val("textspreadsheet");
  style.find('option[value=' + style.val() + ']').text("List (Required for export)");
  $("select[name*='weeks']").val("12-48");

} else {

  var weekStr = $("table:first  td:nth-child(3) font b").html();

  weekStr.split(" ")[1].split("-")[0];
  var weekEpoch = {
    "epochWeek": weekStr.split(" ")[1].split("-")[0],
    "date": weekStr.split("(")[1].split(",")[0]
  };
  weekEpoch = {
    "epochWeek": parseInt(weekEpoch.epochWeek),
    "date": new Date(weekEpoch.date)
  }
  calEvents = [];
  dayIndex = -1 //Day of the week (Mon:0, Fri:4)
  $("table").each(function(i, table) {
    j = 0;
    if ($(table).attr("cellpadding") === "2%") { //If week table (not heading table)
      dayIndex = (dayIndex + 1) % 5; //Increment day of week (0-4)
      if ($('td', table).first().html() === "Activity") { //If contains data
        $('tr', table).each(function(i, row) {
          if (j !== 0) {
            eventJSON = {}
            eventJSON["weekday"] = dayIndex;
            $('td', row).each(function(i) { //Add each cell to JSON
              if (i === 0) { //Special case for col 0 as it needs to be split furth
                var mod = $(this).html().split(",")[0];

                mod = mod.replace(/ /g, '');
                var parts = mod.split("/");
                eventJSON["module"] = parts[0];
                eventJSON["eventType"] = parts[1];
                eventJSON["seq"] = parts[2];
              } else {
                eventJSON[COLUMNS[i]] = $(this).html().replace(/&nbsp;/gi,'');
              }
            });
            calEvents.push(eventJSON); //Add event to array
          }
          j = j + 1;
        });
      }
    }
  })

  var iCalString = "BEGIN:VCALENDAR\n" +
    "PRODID:-//Thomas Hudson//Durham Timetable Exporter//EN\n" +
    "VERSION:2.0\n" +
    "CALSCALE:GREGORIAN\n" +
    "METHOD:PUBLISH\n" +
    "X-WR-TIMEZONE:Europe/London\n\n";

  for (i in calEvents){
    iCalString += eventToiCal(calEvents[i])
  }

  iCalString += "END:VCALENDAR";

  console.log(iCalString)

  function download() {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(iCalString));
    element.setAttribute('download', "DurhamTimetable.ics");

    element.style.display = 'none';
    document.body.appendChild(element);
    $("body").prepend("element")
    element.click();
    document.body.removeChild(element);
  }


  function eventToiCal(json) {
    iCalEventString = "";

    json.weeks = json.weeks.split(",")
    for (i in json.weeks) {
      iCalEventString += "BEGIN:VEVENT\n";
      var weekParts = json.weeks[i].split("-");
      var d = WeekToDate(weekEpoch, parseInt(weekParts[0]));
      d.setDate(d.getDate() + json.weekday)
      d.setHours(json.start.split(":")[0])
      d.setMinutes(json.start.split(":")[1])
      d.setSeconds(0)
      iCalEventString += "DTSTART:" + dateToISO(d) + "\n"
      iCalEventString += "SUMMARY:" + json.module + " " + json.eventType + "\n";
      iCalEventString += "DESCRIPTION:" + json.desc + "\n";
      iCalEventString += "LOCATION:" + json.room + "\n";
      iCalEventString += "ORGANIZER:" + json.staff + "\n";
      iCalEventString += "CONTACT:" + json.staff + "\n";
      time = json.duration.split(":");
      iCalEventString += "DURATION:PT" + time[0] + "H" + time[1] + "\n";
      iCalEventString += "URL:https://www.dur.ac.uk/faculty.handbook/module_description/?year=2015&module_code=" + json.module + "\n";

      if (weekParts.length == 2) { //For Repeating weeks (e.g 12-20)
        var rep = parseInt(weekParts[1]) - parseInt(weekParts[0])
        iCalEventString += "RRULE:FREQ=WEEKLY;COUNT=" + rep + "\n"
      }
      iCalEventString += "END:VEVENT\n\n";
    }
    return iCalEventString;
  }

  function WeekToDate(epoch, week) {
    d = new Date(epoch.date.getTime());
    d.setDate(d.getDate() + (7 * (week - epoch.epochWeek)));
    return d
  }

  function dateToISO(date, time) {
    var n = date.toISOString();
    n = n.replace(/-/g, "");
    n = n.replace(/:/g, "");
    n = n.split(".")[0];
    n = n + "Z"
    return n
  }

  //Inject HTML into page
  var setupString = '<b>Timetable Exporter:</b> ' +
    '<a href="data:text/plain;charset=utf-8,' + encodeURIComponent(iCalString)+'"'+
    'download="DurhamTimetable.ics">Download Timetable</a>'

  $("body").prepend(setupString);
}
