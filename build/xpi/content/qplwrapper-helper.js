// qplwrapper-helper.js
// K. Dooley
// 2014-11-19
//
// Lower-level JavaScript functions that may be called from anywhere.
//
const SVN_EXECUTABLE_PREF = "svnExecutable";
const MY_JAVASCRIPT_STRINGS = "chrome://qplwrapper/locale/qplwrapper.properties";

function GetLocalizedMessage(MsgName) {
    var common = {
    
      _bundle: Components.classes["@mozilla.org/intl/stringbundle;1"]
	       .getService(Components.interfaces.nsIStringBundleService)
	       .createBundle(MY_JAVASCRIPT_STRINGS),
    
	       getLocalizedMessage: function(msg) {
		  return this._bundle.GetStringFromName(msg);
	       }
    };

    return common.getLocalizedMessage(MsgName);
}


function pickFolder(location, LeafName) {
    var SelFolder = GetLocalizedMessage('SelFolder');
    const nsIFilePicker = Components.interfaces.nsIFilePicker;

    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

    fp.init(window, SelFolder, nsIFilePicker.modeGetFolder);

    var rv = fp.show();

    if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
      if (LeafName) {
	document.getElementById(location).value = fp.file.leafName;
      } else {
	document.getElementById(location).value = fp.file.path;
      }
    } else {
      document.getElementById(location).value = "";
    }
    document.getElementById(location).focus();
}


function pickFile(location) {
    var SelFile = GetLocalizedMessage('SelFile');
    const nsIFilePicker = Components.interfaces.nsIFilePicker;

    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

    fp.init(window, SelFile, nsIFilePicker.modeOpen);

    var rv = fp.show();

    if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
      
	document.getElementById(location).value = fp.file.leafName;

    } else {
      document.getElementById(location).value = "";
    }
    document.getElementById(location).focus();
}



function qplLogTest(Message, Append) {
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
    .getService(Components.interfaces.nsIWindowMediator);
  var win = wm.getMostRecentWindow("Komodo");
  var elem = win.document.getElementById('runoutput-scintilla');

  if (!elem) {
    // Might be Komodo 7 - as a sub-pane.
    elem = win.document.getElementById('runoutput-desc-tabpanel').contentDocument.getElementById('runoutput-scintilla');
  }
  
  for(var i in elem) {
    qplLog(i, true);
  }
}

function qplLog(Message, Append) {
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
    .getService(Components.interfaces.nsIWindowMediator);
  var win = wm.getMostRecentWindow("Komodo");
  var elem = win.document.getElementById('runoutput-scintilla');

  if (!elem) {
    // Might be Komodo 7 - as a sub-pane.
    elem = win.document.getElementById('runoutput-desc-tabpanel').contentDocument.getElementById('runoutput-scintilla');
  }

  /* Note: The ko object isn't available when this is called from the QPL Preferences dialog,
   * so I just go get it myself from the 'win' object I made above!
   */
  
  win.ko.run.output.show(window, false);

  elem.QueryInterface(Components.interfaces.koIScintillaView);
  var scimoz = elem.scimoz;

  try {
    var prevLength = scimoz.length;
    var currNL = ["\r\n", "\n", "\r"][scimoz.eOLMode];
    var full_str = Message + currNL;
    var full_str_byte_length = full_str.length; // ko.stringutils.bytelength(full_str);
    var ro = scimoz.readOnly;
    try {
      scimoz.readOnly = false;
      if (!Append) {
	scimoz.selectAll();
	scimoz.clear();
      }
      scimoz.appendText(full_str_byte_length, full_str);
    } finally {
      scimoz.readOnly = ro;
    }
    // Bring the new text into view.
    scimoz.gotoPos(prevLength + full_str_byte_length);
  } catch (ex) {
    alert("Problems printing [" + Message + "]:" + ex + "\n");
  }

  return;
}


// cmd = command line
// cwd = current working directory
// env = environment variable
// input file
// log = 0-don't append to message output, 1=append to current message output

function qplRun(cmd, cwd, env, input, log) {
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	.getService(Components.interfaces.nsIPromptService);
    var prefManager = Components.classes["@mozilla.org/preferences-service;1"]
	.getService(Components.interfaces.nsIPrefBranch);
    var runSvc = Components.classes["@activestate.com/koRunService;1"]
	.getService(Components.interfaces.koIRunService);

    var o_output = new Object();
    var o_error = new Object();

    try {
       var ExitCode = parseInt(runSvc.RunAndCaptureOutput(cmd, cwd, env, input, o_output, o_error));
    } catch(e) {
	prompts.alert(window, QPLWrapper, "qplRun: " + cmd + "\n" + e);
    }

    if (isNaN(ExitCode)) {
	ExitCode = 0;
    }

    qplLog(cmd, true);

    if (ExitCode == 0) {
	qplLog(o_output.value, log);
	qplLog(o_error.value, log);
	if (o_error.value.length && /lock/.test(cmd)) {
	    prompts.alert(window, QPLWrapper, QPLFilesAlreadyCheckedOut);
	    ExitCode = 1;
	}
    } else {
	qplLog(o_error.value, log);
    }
    return ExitCode;
}



function GetSvnPath()
{
    var SvnExecutable = "svn";
    var prefs = Components.classes['@activestate.com/koPrefService;1']
	.getService(Components.interfaces.koIPrefService).prefs;
    if (prefs.hasStringPref(SVN_EXECUTABLE_PREF)) {
	if ( /svn/.test(prefs.getStringPref(SVN_EXECUTABLE_PREF)) ) {
	    SvnExecutable = prefs.getStringPref(SVN_EXECUTABLE_PREF);
	}
    }
    return SvnExecutable;
}



function chromeToPath(aPath) {
    if (!(/^chrome:/.test(aPath))) {
	return ""; //not a chrome url
    }

    var ios = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces["nsIIOService"]);
    var uri = ios.newURI(aPath, "UTF-8", null);
    var cr = Components.classes['@mozilla.org/chrome/chrome-registry;1'].getService(Components.interfaces["nsIChromeRegistry"]);
    var rv = cr.convertChromeURL(uri).spec;

/*    if (/^file:/.test(rv))
	rv = this.urlToPath(rv);
    else
	rv = this.urlToPath("file://" + rv);

qplLog("chromeToPath rv: " + rv);
*/
    return rv;
}

function urlToPath(aPath) {

    if (!aPath || !/^file:/.test(aPath))
	return "";

    var ph = Components.classes["@mozilla.org/network/protocol;1?name=file"]
	.createInstance(Components.interfaces.nsIFileProtocolHandler);
    var rv = ph.getFileFromURLSpec(aPath).path;
    return rv;
}


function SavePreference(mypref, value) {
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].
    getService(Components.interfaces.nsIPrefService).
    getBranch(MY_PREF_EXT);

    prefs.setCharPref(mypref, value);

    return;
}

function GetPreference(mypref) {
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].
    getService(Components.interfaces.nsIPrefService).
    getBranch(MY_PREF_EXT);

    return prefs.getCharPref(mypref);
}


function GetUserName() {
    var runSvc = Components.classes["@activestate.com/koRunService;1"]
	.getService(Components.interfaces.koIRunService);

    var cmd = "whoami";
    var cwd = "";
    var env = "";
    var input = "";
    var o_output = new Object();
    var o_error = new Object();

    try {
	runSvc.RunAndCaptureOutput(cmd, cwd, env, input, o_output, o_error);
	if (/\\/.test(o_output.value)) {
	    o_output.value = o_output.value.replace(/^.+\\/, "");
	}
	return(o_output.value.trim());
    } catch(e) {
	return("?")
    }
}

function GetAccount(Notes) {
    
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                        .getService(Components.interfaces.nsIPromptService);
			
    var username = {value: GetUserName()};              // default the username to user
    var password = {value: ""};              // default the password to pass
    var check = {value: false};                   // default the checkbox to true
    var QPLWrapper=GetLocalizedMessage('QPLWrapper');
    var JobTrackerPasswordSave=GetLocalizedMessage('JobTrackerPasswordSave');
    
    var result = prompts.promptUsernameAndPassword(null, QPLWrapper, Notes, username, password, JobTrackerPasswordSave, check);
    
    return {status: result, user: username.value, password: password.value};	// returns one object with three properties!
    
}

function SetPlace(ko, uri) {
    try {
	ko.places.manager.openDirectory(uri);
    } catch(e) {
	qplLog("Could not set place to: " + uri + "\n" + e, true);
    }
}

/*  WordWrap()
 *  This function emulates PHP’s wordwrap. It takes four arguments:

    The string to be wrapped.
    The column width (a number, default: 70)
    The character(s) to be inserted at every break. (default: ‘\n’)
    The cut: a Boolean value (false by default). See PHP docs for more info.
    
    By James Padolsey, http://james.padolsey.com/javascript/wordwrap-for-javascript/
*/

function WordWrap( str, width, brk, cut ) {
 
    brk = brk || '\n';
    width = width || 70;
    cut = cut || false;
 
    if (!str) { return str; }
 
    str = str.replace(/\n\n/g, '\x01');
    str = str.replace(/[\t\n]/g, ' ');
    str = str.replace(/ {2,}/g, ' ');
    
    var regex = '.{1,' +width+ '}(\\s|$)' + (cut ? '|.{' +width+ '}|.+$' : '|\\S+?(\\s|$)');
    
    str = str.match( RegExp(regex, 'g') ).join( brk );
    
    str = str.replace(/\x01/g, '\n\n');
 
    return str;
 
}


function GetQuestionText(ko, Text) {
	
	ko.views.manager.currentView.setFocus();
	
	var str = ko.views.manager.currentView.selection.trim();
	
	if (str.length) {
		str = str.replace(/\r\n/g, '\n');
		str = str.replace(/\n\n/g, '\x01');
		str = str.replace(/[\t\n]/g, ' ');
	        str = str.replace(/\x01/g, '\n\n');
	        str = str.replace(/ {2,}/g, ' ');
	    
		document.getElementById(Text).value = str;
	}
}

