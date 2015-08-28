

function navigate(url) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.tabs.update(tabs[0].id, {url: url});
  });
}

document.addEventListener('DOMContentLoaded', function() {
    var links = document.getElementsByTagName("a");
    for (var i = 0; i < links.length; i++) {(function () {
            var ln = links[i];
            var location = ln.href;
            ln.onclick = function () {
              navigate(location);
            };
        })();
    }
  //navigate("https://timetable.dur.ac.uk/module.htm")
});
