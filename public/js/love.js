$(document).ready(function() {
  //~~ SETUP GLOBAL REFS
  //setup cookies
  var fromCookie = $.cookie('username');
  var toCookie = $.cookie('to');

  //forms
  var $dialogButton = $('#dialogform :submit');
  var $userButton = $('#userform :submit');

  //setup websockets
  var ws = new WebSocket('ws://127.0.0.1:9000');

  //util

  function appendMessage(from, message) {
    return $("#messages").append("<div class=\"msg\"><i>" + from + "</i> => " + message + "</div>");
  }

  function checkMessages(channel) {
    return exists(fromCookie) && exists(toCookie) && generateId(fromCookie, toCookie) == channel
  }

  function getKeyCode(event) {
    var keycode = (event.keyCode ? event.keyCode : (event.which ? event.which : event.charCode));
    return keycode;
  }

  function hideUserForm(from, to) {
    $('#logged-in').html("<b>why, hello: " + from + "</b>");
    $('#dialog-flash').html("send a message to your special one, <b>" + to + "</b>: ")
    $('#user-content').hide();
    $('#dialog-content').show();
    $('#message').focus();
  }
  //setup initial state
  if(exists(fromCookie) && exists(toCookie)) {
    hideUserForm(fromCookie, toCookie);
  } else {
    $('#user-content').show();
    $('#dialog-content').hide();
    $('#name').focus();
  }

  //~~ WEBSOCKETS CALLBACKS
  ws.onopen = function() {
    if(exists(fromCookie) && exists(toCookie)) {
      ws.send(JSON.stringify({
        'from': fromCookie,
        'to': toCookie
      }));
    }
  };

  ws.onerror = function(error) {
    content.html($('<p>', {
      text: 'Sorry, server is not available :( </p>'
    }));
  };

  ws.onmessage = function(message) {
    try {
      var json = JSON.parse(message.data);
      if(!exists(json["action"])) {
        console.log("action attribute is missing");
      } else {
        switch(json["action"]) {
        case "list":
          if(checkMessages(json["channel"])) {
            $("#messages").html("");
            $.each(json["data"], function(i, item) {
              var unparsed = item.split("|");
              appendMessage(unparsed[0], unparsed[1]);
            });
          }
          break;
        }
      }
    } catch(e) {
      console.log(e);
      console.log('This doesn\'t look like a valid JSON: ', message.data);
      return;
    }
  }

  //~~ FORM CALLBACKS
  //userform
  $userButton.click(function(e) {
    e.preventDefault();
    var name = $('#name').val();
    var to = $('#to').val();
    if(name == '' || to == '') {
      $('#usererror').css("color", "red").html("I'm sorry darling, but you have to fill both fields");
    } else {
      $('#usererror').html("");
      //save cookie to browser and update global refs as well
      $.cookie('username', name);
      $.cookie('to', to);
      fromCookie = name;
      toCookie = to;
      $('#logged-in').html("why, hello: " + fromCookie);
      hideUserForm(fromCookie, toCookie);
      ws.send(JSON.stringify({
        'action': 'save',
        'from': fromCookie,
        'to': toCookie
      }));
    }
  });

  $('#userform input').bind('keydown', function(event) {
    // track enter key
    var keycode = getKeyCode(event);
    // keycode for enter key
    if(keycode == 13) {
      $userButton.click();
      return false;
    } else {
      return true;
    }
  });

  //dialogform
  $dialogButton.click(function(e) {
    e.preventDefault();
    var textArea = $("#dialogform textarea");
    var msg = textArea.val();
    if(msg == '') {
      $('#dialogerror').css("color", "red").html("hmm, nothing to do...");
    } else {
      $('#dialogerror').html("");
      ws.send(JSON.stringify({
        'from': fromCookie,
        'to': toCookie,
        'message': msg
      }));
      textArea.val('');
    }
  });

  $('#dialogform textarea').bind("keydown", function(event) {
    // track enter key
    var keycode = getKeyCode(event);
    // keycode for enter key
    if(keycode == 13) {
      $dialogButton.click();
      return false;
    } else {
      return true;
    }
  });

});