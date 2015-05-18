// overlay.js
// K. Dooley
// 2014-11-19
//
// Note: Requires qplwrapper-helper.js for some support functions.
//
const MY_ID = "kevin@respondemeum.com";
const MY_SVN_PREF = "extensions.qplwrapper.qpl_subversion_repository";
const MY_SVN2_PREF = "extensions.qplwrapper.qpl_subversion_repository2";


var qplwrapper = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("qplwrapper-strings");

  }
};

window.addEventListener("load", function(e) {
  qplwrapper.onLoad(e);
}, false);

// overlay.js >>>
var popupWindow = null;

function qplBuild(target) {
  if (popupWindow != null)
    popupWindow.close();

  popupWindow = window.open("chrome://qplwrapper/content/" + target + ".xul", "QPL6", "chrome");

  popupWindow.focus();
  return;
}

function qplBuildDialog(ko, target, option) {
  if (popupWindow != null)
    popupWindow.close();

  popupWindow = window.openDialog("chrome://qplwrapper/content/" + target + ".xul", "QPL6", "chrome", ko, option);

  popupWindow.focus();
  return;
}

var popupHelpWindow = null;

function qplBuildHelpDialog(ko, target) {
  if (popupHelpWindow != null)
    popupHelpWindow.close();

  popupHelpWindow = window.openDialog('chrome://qplwrapper/content/qpl_help.xul', 'qpl_help', 'chrome', target);
  popupHelpWindow.focus();
  return;
}


function qplEscapeChars(ko) {
  var SB = Components.classes["@mozilla.org/intl/stringbundle;1"]
    .getService(Components.interfaces.nsIStringBundleService)
    .createBundle("chrome://qplwrapper/locale/qplwrapper.properties");

  var QPLWrapper = SB.GetStringFromName('QPLWrapper');
  var SelectTextToEscape = SB.GetStringFromName('SelectTextToEscape');

  var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
    .getService(Components.interfaces.nsIPromptService);

  ko.views.manager.currentView.setFocus();
  ko.views.manager.currentView.scimoz.beginUndoAction();

  var SourceText = ko.views.manager.currentView.scimoz.selText.replace(/\\/g, "");

  if (SourceText.length) {
    SourceText = SourceText.replace(/([\"#&<>%\$@=!`~_+])/g, "\\$1");
    ko.views.manager.currentView.scimoz.replaceSel(SourceText);
  } else {
    prompts.alert(window, QPLWrapper, SelectTextToEscape);
  }

  ko.views.manager.currentView.scimoz.endUndoAction();

  return;

}

// Format is one of the QPL format shortcuts: +, ~, _
function qplCharFormat(ko, Format) {
  var SB = Components.classes["@mozilla.org/intl/stringbundle;1"]
    .getService(Components.interfaces.nsIStringBundleService)
    .createBundle("chrome://qplwrapper/locale/qplwrapper.properties");

  var QPLWrapper = SB.GetStringFromName('QPLWrapper');
  var SelectTextToEscape = SB.GetStringFromName('SelectTextToEscape');

  var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
    .getService(Components.interfaces.nsIPromptService);

  ko.views.manager.currentView.setFocus();
  ko.views.manager.currentView.scimoz.beginUndoAction();
  
  var SourceText = "";

  switch (Format) {
    case "+":
      var SourceText = ko.views.manager.currentView.scimoz.selText.replace(/\+/g, "");
      break;
    
    case "~":
      var SourceText = ko.views.manager.currentView.scimoz.selText.replace(/\~/g, "");
      break;
    
    case "_":
      var SourceText = ko.views.manager.currentView.scimoz.selText.replace(/\_/g, "");
      break;
    
    default: 
      var SourceText = ko.views.manager.currentView.scimoz.selText.replace(/\+/g, "");
      break;
  }
  
  if (SourceText.length) {
    SourceText = Format + SourceText + Format;
    ko.views.manager.currentView.scimoz.replaceSel(SourceText);
  } else {
    prompts.alert(window, QPLWrapper, SelectTextToEscape);
  }

  ko.views.manager.currentView.scimoz.endUndoAction();

  return;

}




// Insert may be one of QPL special chars, like | <br>, = &bull;, 
function qplCharInsert(ko, Insert) {

  switch (Insert) {
    case "nbsp":
      Insert = "\\&nbsp;";
      break;
    
    case "sect":
      Insert = "\\&sect;";
      break;
    
    case "arr_d":
      Insert = '\\<IMG SRC\\=\\"qpl\\_arr\\_d.png\\" TITLE\\=\\"Down arrow\\" HEIGHT\\=\\"16\\" WIDTH\\=\\"16\\" \\>';
      break;
    
    case "arr_u":
      Insert = '\\<IMG SRC\\=\\"qpl\\_arr\\_u.png\\" TITLE\\=\\"Up arrow\\" HEIGHT\\=\\"16\\" WIDTH\\=\\"16\\" \\>';
      break;
    
    case "arr_l":
      Insert = '\\<IMG SRC\\=\\"qpl\\_arr\\_l.png\\" TITLE\\=\\"Left arrow\\" HEIGHT\\=\\"16\\" WIDTH\\=\\"16\\" \\>';
      break;
    
    case "arr_r":
      Insert = '\\<IMG SRC\\=\\"qpl\\_arr\\_r.png\\" TITLE\\=\\"Right arrow\\" HEIGHT\\=\\"16\\" WIDTH\\=\\"16\\" \\>';
      break;
  }
  
  ko.views.manager.currentView.setFocus();
  ko.views.manager.currentView.scimoz.beginUndoAction();
  ko.views.manager.currentView.scimoz.replaceSel(Insert);
  ko.views.manager.currentView.scimoz.endUndoAction();

  return;
}



function qplRefreshProject(ko) {
  var Target = Components.classes["@mozilla.org/file/local;1"]
    .createInstance(Components.interfaces.nsILocalFile);
  var koDoc = ko.views.manager.currentView.koDoc;
  var zipReader = Components.classes["@mozilla.org/libjar/zip-reader;1"]
    .createInstance(Components.interfaces.nsIZipReader);

  var directoryService = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties);
  var file = directoryService.get("ProfD", Components.interfaces.nsIFile);
  file.append("extensions");
  file.append(MY_ID);
  file.append("content");
  file.append("lib");
  file.append("qpl_master_files.zip");

  qplLog(GetLocalizedMessage('UnpackingFiles') + " " + koDoc.file.dirName, false);

  zipReader.open(file);
  zipReader.test(null);

  Target.initWithPath(koDoc.file.dirName);

  var entries = zipReader.findEntries(null);

  while (entries.hasMore()) {
    var entryName = entries.getNext();
    var itemLocation = Target.clone();
    var parts = entryName.split("/");

    for (var i = 0; i < parts.length; ++i) {
      itemLocation.append(parts[i]);
      qplLog(parts[i], true);
    }

    zipReader.extract(entryName, itemLocation);
  }
  zipReader.close();
  return;

}


function svnProjectInfo(ko)
{
    var SvnExecutable = GetSvnPath();
    var ProjectDirectory = ko.views.manager.currentView.koDoc.file.dirName;
    var SvnInfo=GetLocalizedMessage('SvnInfo');
    
    qplLog(SvnInfo, false);
    ko.commands.doCommand('cmd_saveAll');

    qplRun(SvnExecutable + " info --non-interactive",
		    ProjectDirectory,
		    "",
		    "",
		    true);

    qplRun(SvnExecutable + " log -l 5 -v --non-interactive",
		    ProjectDirectory,
		    "",
		    "",
		    true);
    
    qplRun(SvnExecutable + " status -u --non-interactive",
		    ProjectDirectory,
		    "",
		    "",
		    true);

}



function qplWordWrapSelection(ko) {

  var SourceText = WordWrap(ko.views.manager.currentView.scimoz.selText);

  ko.views.manager.currentView.setFocus();
  ko.views.manager.currentView.scimoz.beginUndoAction();
  ko.views.manager.currentView.scimoz.replaceSel(SourceText);
  ko.views.manager.currentView.scimoz.endUndoAction();

  return;

}



function qplBlockCommentSelection(ko) {

  var SourceText = ko.views.manager.currentView.scimoz.selText;

  ko.views.manager.currentView.setFocus();
  ko.views.manager.currentView.scimoz.beginUndoAction();
  ko.views.manager.currentView.scimoz.replaceSel("\n*! >>>>\n" + SourceText.trim() + "\n*! <<<<\n");
  ko.views.manager.currentView.scimoz.endUndoAction();

  return;

}

function qplWordCleanup(ko) {
  ko.find.replaceAllInMacro(window, 0, '\\n0\\s+', '\\n', true, 2, 0, false, false);
  ko.find.replaceAllInMacro(window, 0, '\n.\n', '\n\n', true, 2, 0, false, false);
  ko.find.replaceAllInMacro(window, 0, '\\n[0-9]+[A-Za-z]?\\.\\s', '\\n', true, 2, 0, false, false);
  ko.find.replaceAllInMacro(window, 0, '__+', '', true, 2, 0, false, false);
  ko.find.replaceAllInMacro(window, 0, '\\n\\s+', '\\n', true, 2, 0, false, false);
  ko.find.replaceAllInMacro(window, 0, '\\t', ' ', true, 2, 0, false, false);
  ko.find.replaceAllInMacro(window, 0, '“', '\"', true, 2, 0, false, false);
  ko.find.replaceAllInMacro(window, 0, '”', '\"', true, 2, 0, false, false);
}


// modified function of the same name from chrome://komodo/content/pref/pref-alllangfonts.js
function qplGetColorCode(ko) {
  
  var picker = Components.classes['@activestate.com/koSysUtils;1']
		     .getService(Components.interfaces.koIColorPickerAsync);
  var SourceText = ko.views.manager.currentView.scimoz.selText.trim().toUpperCase();
  
  if (/\#[0-9A-F]{6}/.test(SourceText)) {
    color = SourceText;
  } else {
    color = "#666666";
  }
 	
  picker.pickColorAsync(function(newcolor) {
    if (newcolor) {
      ko.views.manager.currentView.setFocus();
      ko.views.manager.currentView.scimoz.beginUndoAction();
      ko.views.manager.currentView.scimoz.replaceSel(newcolor);
      ko.views.manager.currentView.scimoz.endUndoAction();
    }
  }, color, 1.0, window.screenX + window.width/3, window.screenY + window.height/3);
}




function ListSamples() {
    Components.utils.import("resource://gre/modules/osfile.jsm");
    
    var SamplePath = chromeToPath("chrome://qplwrapper/content/lib");
    SamplePath = SamplePath.replace(/^file:\/\//, "");
    
	    
    qplLog("Looking for sample files at " + SamplePath, true);

    // Open iterator
    let iterator = new OS.File.DirectoryIterator(SamplePath);
    let subdirs = [];
    // Iterate through the directory
    let promise = iterator.forEach(function onEntry(entry) {
	if (entry.isDir) {
	    subdirs.push(entry);
	} else {
	    
		qplLog(entry.path, true);
		qplLog(entry.name, true);
	}
    });

    // Finally, close the iterator
    promise.then(function onSuccess() {
	iterator.close();
	return subdirs;
    }, function onFailure(reason) {
	iterator.close();
	throw reason;
    });
}




function svnExportProject(ko) {
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    var SvnExecutable = GetSvnPath();
    var ProjectDirectory = ko.views.manager.currentView.koDoc.file.dirName;
    var SvnExport=GetLocalizedMessage('SvnExport');
    var SvnExportFolder = GetLocalizedMessage('SvnExportFolder');
    var SvnExportCancelled = GetLocalizedMessage('SvnExportCancelled');
    
    qplLog(SvnExport, false);
    ko.commands.doCommand('cmd_saveAll');

    fp.init(window, SvnExportFolder, nsIFilePicker.modeGetFolder);

    var rv = fp.show();

    if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
      qplRun(SvnExecutable + " export " + ProjectDirectory + " --non-interactive",
		    fp.file.path,
		    "",
		    "",
		    true);
    } else {
      qplLog(SvnExportCancelled, true);
    }
}


function svnStealProjectLock(ko) {
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    var SvnExecutable = GetSvnPath();
    var Pg6Name = ko.views.manager.currentView.koDoc.file.baseName;
    var ProjectDirectory = ko.views.manager.currentView.koDoc.file.dirName;
    var SvnStealProjectLock=GetLocalizedMessage('SvnStealProjectLock');
    
    qplLog(SvnStealProjectLock, false);
    ko.commands.doCommand('cmd_saveAll');

    qplRun(SvnExecutable + " --force lock " + Pg6Name + " --non-interactive",
		  ProjectDirectory,
		  "",
		  "",
		  true);
}



function getKeywordInfo(ko) {

  var Info = {
   COLUMNS: { options: '[= # | ON | OFF | BREAK ]', suboptions: '', comments: 'Define a block of questions that are put into a column layout. #=the number of columns to be used and starts column layout with the next question. ON=start the column layout using the default number of columns, 2, or the number of columns used in a previous setting. OFF=stop putting questions in a column layout. BREAK=end columns layout with the previous question and start a new column layout with the next question.  Each question in a COLUMNS block is added to the end of a row until the defined number of columns is filled. Then a new row is started.  You must have enough questions in the block to fill all the columns that are defined. You may have any number of rows.' },
   COLUMNSHEADINGS: { options: '[= ON | OFF*]', suboptions: '', comments: 'Define heading row for COLUMNS block. ON=use question text from first row of questions as heading labels and do not put question text in COLUMNS cells with answer fields. (Note: An exception is made for VOID questions where this is reversed: VOID question text is put in COLUMN cells and it answer label is used as the column heading.) OFF=do not use a heading row and put entire question into each COLUMNS cell.' },
   COLUMNSROWSHADING: { options: '[= ON | OFF* ]', suboptions: '', comments: 'Define shading for COLUMNS block. ON=apply alternating row background shading.  OFF=do not apply alternating row background shading (default). (Note: Background colors are set using the BACKGROUND or COLORSCHEME commands.)' },
   BACKGROUND: { options: '= BODY | FORM | ROWHEADER | ROW | ROW1 | ROW2 | ROWDK | MENUROW | MENUROWON | HR | BUG | NAVBB | HOVER | HOVERMAIN | HOVERMENU | HOVERMENUNAVBB | POPUP | POPUPBANNER', suboptions: '= color name | color number', comments: 'Set the color for a specific web site element. The first option must be used to pick the element and the sub-option sets the color for that element. Any standard HTML color name, or the six-digit hex value of a color (starting with the # character), may be used. (Ex. SEAGREEN =  #2e8b57)' },
   COLORSCHEME: { options: '= color name | color number', suboptions: '[= offset ]', comments: 'Set the color scheme for the project web site. Colors are automatically generated for all web site elements based on the background color selected. (Any hue may be selected, but saturation and luminosity values are best if they are each set near a medium value such as 100.) Any standard HTML color name, or the hex value of a color (preceded by the \'#\' character), may be used as an option. (Ex. SEAGREEN =  #2e8b57)  A different set of complementary colors for the same background color may be chosen by setting the offset sub-option to a number from 1 to 6.' },
   LOGO: { options: '[ = ON* | OFF | "file name"', suboptions: '[ = "alt tag phrase..." ]', comments: 'Set name of file to be used as graphic logo at the bottom of the project home page.  ON=use default file, qpl_logo.png. OFF=do not use a logo. "file name"=use this logo file. May also use a sub-option to set the label that appears if a user floats their mouse cursor over the logo graphic on the home page.' },
   NEWPAGE: { options: '[= "Menu label"]', suboptions: '', comments: 'Starts the next question at the start of a new page of the web form. A label may also be defined that will be put into the menu as a hypertext link to the question. If a NEWPAGE command is used without a label, and no SUBTITLE command is used, the hypertext link in the menu will be "Page #" where # is the page number.' },
   PAGE: { options: '', suboptions: '', comments: 'When creating a text-only version of the questionnaire form, this command starts writing the next question at the start of a new page.' },
   PAGEGUTTER: { options: '= #', suboptions: '', comments: 'Width of the space to the left of a question that holds the question number in pixels.  Default is 35 pixels. May be set from 10 to 75 pixels.' },
   PAGEWIDTH: { options: '= #', suboptions: '', comments: 'Width of the questionnaire page in pixels, including the menu if it is ON.  Default is 770 pixels. Minimum width is 770 pixels and maximum width is 1660 pixels.' },
   QNUMBERING: { options: '[= ON* | OFF | INCREMENT | "A1"]', suboptions: '', comments: 'Sets the numbering scheme starting at the next question. ON=resume numbering on using last format. OFF=stop numbering. INCREMENT=increase the current major number by one. (When using major and minor numbers, the minor number is incremented automatically. You must use the INCREMENT option to increase the major number which also resets the minor number. "A1"=initialize the major and minor numbers.  An alpha character sets an alpha start, while a digit sets a numeric start. For example, "A1" will start the question numbering to A1, A2, A3, etc. "1a" will start numbering 1a, 1b, 1c, etc. The major number may be omitted, so "10," will start numbering 10, 11, 12, etc. (Note: A question will be automatically named using this number no name has been specifically defined with the QUESTION command.)' },
   SUBTITLE: { options: '= "label"', suboptions: '', comments: 'The first SUBTITLE command used creates the project-level subtitle that appears centered, at the top of the web site pages (just below the title). A later SUBTITLE command puts a left-justified heading above the next question and a hypertext link in the menu on the left to this question.' },
   HELLO: { options: '[= ON | OFF | "Begin"]', suboptions: '', comments: 'Define a block of text for the project home page.  ON=start HELLO block. The following text lines will be put on the project home page. OFF=end of HELLO block. "Begin" =start the hello block with a label that will be used to replace the default "Begin questionnaire" label on the home page log in button.' },
   HELP: { options: '[= ON | OFF]', suboptions: '', comments: 'Define a block of text that will be used for the Contact statement that appears in the menu, exit page, and various other error pages on the web site. ON=start HELP block. The following text lines will used for the Contact information. OFF=end of HELP block.' },
   HIDE: { options: '[= ON | OFF]', suboptions: '', comments: 'Prevents questions from being displayed on the web page. ON=do not display the following one or more questions. OFF=stop hiding questions. You may not HIDE questions that are inside COLUMNS or MATRIX blocks.' },
   MATRIX: { options: '[= ON | OFF | BREAK]', suboptions: '', comments: 'Change the layout of the following questions so that the question text is on left and the answer field(s) is on the right in the same row.  ON=start  MATRIX layout for one or more following questions. (Questions with multiple input fields, such as MULT, may not be put in the same MATRIX block as questions that have a single input field, such as STRING.) OFF=end the MATRIX layout with the previous question. BREAK=end a MATRIX block and start a new MATRIX block. (Here, a line space will be inserted between the blocks and in the case of MULT and CHECK questions, a new header row of answer labels will be inserted to start the new block.) The MATRIX layout and the COLUMNS layout may not be applied to the same questions.' },
   MATRIXDKSHADING: { options: '[= ON* |# | OFF]', suboptions: '', comments: 'Sets shading of right-most answer field columns in a MATRIX layout.  ON=shade the right-most column (default). #=number of right-most columns to shade. OFF=do not shade any columns.' },
   MATRIXROWSHADING: { options: '[= ON* | OFF]', suboptions: '', comments: 'Set alternating background color shading for question rows in the MATRIX block. ON=use alternating background shading (default). OFF=do not use alternating background shading.' },
   MATRIXWIDTH: { options: '[= #]', suboptions: '', comments: 'Set the width of the MATRIX layout questions on the web form in pixels. The default is the full width of the web page, minus the space needed for the menu (if used) and the gutter. The MATRIXWIDTH is reset to the current system default if the command is used with no argument. (This value will vary according to the current PAGEWIDTH setting.)' },
   NAVIGATION: { options: '[= ON* | OFF ]', suboptions: '', comments: 'Display navigation buttons in menu on the left side of the questionnaire page. Default is ON.' },
   PROGRESS: { options: '[= ON* | OFF ]', suboptions: '', comments: 'Display progress bar in menu on the left side of the questionnaire page. Default is ON.' },
   SUMMARY: { options: '[= ON* | OFF ]', suboptions: '', comments: 'Display link to response summary page in menu on the left side of the questionnaire page. Default is ON.' },
   CLOSEBUTTON: { options: '[= ON* | OFF]', suboptions: '', comments: 'When used inside a POPUP block, the CLOSEBUTTON command sets the display of the close button in the browser window. ON=display a print button (default). OFF=do not display a close button.' },
   HEIGHT: { options: '[= #]', suboptions: '', comments: 'When used inside a POPUP block, the HEIGHT command sets width of the POPUP browser window in pixels. Default is 300 pixels. Using the command with no argument resets the HEIGHT to the default.' },
   POPUP: { options: '[= ON | name | OFF]', suboptions: '', comments: 'Create a POPUP page.  ON=start a POPUP definition block.  The name of the POPUP will be "POPUP" plus a sequence number starting at "1." Name=start a POPUP definition block using this name.  The name of a POPUP block is used the text of a question to create a hypertext link to this POPUP page. The name must be delimited by carets (^) when used in the question text. The name may be from one to 16 characters long, must start with a letter, and may only contain letters and numbers. The text lines following the POPUP command define the contents of the popup page. OFF=end the POPUP definition.' },
   PRINTBUTTON: { options: '[= ON* | OFF]', suboptions: '', comments: 'When used inside a POPUP block, the PRINTBUTTON command sets the display of the print button in the browser window. ON=display a print button (default). OFF=do not display a print button.' },
   TITLE: { options: '= "title"', suboptions: '', comments: 'When used inside a POPUP block, the TITLE command sets the title that is displayed at the top of the browser window.' },
   BY: { options: '= question name', suboptions: '', comments: 'Define a BY variable to be used when computing summary statistics for an e-supplement or technical appendix. Question=the name of the cross-tabulation question.' },
   CLASS: { options: '= question name', suboptions: '', comments: 'Define a CLASS variable to be used when computing summary statistics for an e-supplement or technical appendix. Question=the name of the class question.' },
   CONTACT: { options: '= "contact for questions"', suboptions: '', comments: 'Set the information that will be used to fill in the Contact information on the e-supplement home web page. (Ex. "If you have questions concerning these data, please contact Yvonne D. Jones at (202) 512-8678 or Jonesy@gao.gov.")' },
   ISSUEDATE: { options: '= "month year"', suboptions: '', comments: 'Set the issue date for the GAO e-supplement using month and year format (ex. "January 2009").' },
   JOBCODE: { options: '= #', suboptions: '', comments: 'Set the job code used for the work done to prepare the GAO e-supplement.' },
   PERCENT: { options: '= ON* | OFF', suboptions: '', comments: 'Define how summary statistics are presented for an e-supplement or technical appendix. ON=include percentages (default). OFF=do not include percentages.' },
   PRODUCT: { options: '[= ON | ESUPPLEMENT* | APPENDIX  | OFF]', suboptions: '', comments: 'Define an e-supplement or technical appendix block.  Only one PRODUCT block may be defined. ON=start PRODUCT block using default e-supplement product type.  ESUPPLEMENT= start PRODUCT block using e-supplement product type. APPENDIX=start PRODUCT type using appendix product type. Text lines entered after one of these commands will be used for the content of the Background section of the e-supplement home web page. Text lines are not used for a technical appendix. OFF=end PRODUCT block.' },
   PRODUCTNUMBER: { options: '= "GAO-#-#SP"', suboptions: '', comments: 'Set the product number of the GAO e-supplement .' },
   PRODUCTTITLE: { options: '= "e-supplement or appendix title"', suboptions: '', comments: 'Set the title for the GAO e-supplement home web page, or the title of the technical appendix.' },
   REPORTNUMBER: { options: '="GAO-#-#"', suboptions: '', comments: 'Set the product number of the GAO report that this e-supplement supports.' },
   REPORTTITLE: { options: '= "main report title"', suboptions: '', comments: 'Set the title of the GAO report that this e-supplement supports.' },
   WEIGHT: { options: '= question name', suboptions: '', comments: 'Define a WEIGHT variable to be used when computing summary statistics for an e-supplement or technical appendix. Question=the name of the weighting question.' },
   FORMAT: { options: '= SOQ | SOL | EOL | EOQ | NONE', suboptions: '= HTML format tags', comments: 'Add HTML formatting to the output of an SQL query when it is used within the text of a question.  SOQ=set HTML tags to be used before the start of the query. SOL=set HTML tags to be used at start of each row of the query output. EOL=set HTML tags to be used at the end of each row of the query output. EOQ=set HTML tags to be used at the end of the query output. NONE=set HTML tags to be used if the query results in no output rows.' },
   QUERY: { options: '[= ON | name | OFF]', suboptions: '', comments: 'Define an SQL query block. A query block is used to add a query to an SLIST or NLIST question to generate the drop-down list, or embed the results of a query in the text of a question.  Any number of QUERY blocks may be defined. ON=start a query block and name it "QUERY" plus a sequence number. Name=start a query block with this name. The following text lines are used for the SQL query. The query must start with the word "SELECT". Only one SELECT statement may be used in one QUERY block.\n\nWhen using a QUERY block to embed a dynamically-generated list within the text of a question, the query output must have a column named "LABEL\' which will be used for the list. The query may also include columns named "SOL" (start-of-line), and "EOL" (end-of-line) . The output of these columns should be HTML tags which will be used to format the LABEL output when displayed on the web page.\n\nEx. SELECT [something AS \'SOL\',] something AS \'LABEL\' [, something AS \'EOL\'] FROM mytable WHERE criteria ORDER BY criteria;\n\nA QUERY block is embedded into the text of a question by using its name inside curly braces ({}). This will be replaced by the results of the query when the page is run on the web server.\n\nWhen using a QUERY block to set a dynamically-generated answer list to an NLIST or SLIST question, the query output must have a column named "LABEL," which will be used for the displayed list. It also must have a column named "VALUE," which will be used to code the label in the questionnaire database. This value must be numeric if you are using the NLIST question. And all the values used in the list must be greater than zero and unique.  The query may also include a "GROUP" column, which is used to label groups of answers in a drop-down list.\n\nEx. SELECT [something AS \'GROUP\',] something AS \'LABEL\', something AS \'VALUE\' FROM mytable WHERE criteria ORDER BY criteria;\n\nColumns with other names are ignored.' },
   ALIGN: { options: '[= LEFT* | CENTER | RIGHT]', suboptions: '', comments: 'Set the alignment of question text. LEFT=left-align the question text (default). RIGHT=right-align the question text. CENTER=center the question text.\n\nIf this command is used inside a QUESTION block, it only affects that question.\n\nIf this command is used outside a QUESTION block, it sets the alignment of all the following questions, or until another ALIGN command is used. It does not change the default alignment of questions that are inside a MATRIX or COLUMNS block.\n\nIf this command is used immediately after the start of a COLUMNS or MATRIX block, and before the first QUESTION in the block, then its sets the alignment of the questions in that block and within later blocks that may be used.' },
   ANSWER: { options: '[= # | name]', suboptions: '', comments: 'Define the end of the question text inside a QUESTION block, and the start of the answer text.\n\nThe option must be used to define the database field widths for NUMBER and STRING questions. This option must be used to define the database field widths for SLIST and NLIST if the answer lists are being generated by an SQL query.\n\nThis command may also be used to copy all of the answer settings from another question, including the field width size and answer text lines, by specifying the name of the source question. This question must have the same question TYPE as this question, and it must be defined before this question in the QPL program.' },
   ANUMBERING: { options: '[= ON | OFF | "1" | "A" | "a"]', suboptions: '', comments: 'Define how MULT and CHECK question answer lists will be numbered.  This command follows the same behavior as the ALIGN command where, for example, the answer numbering style can be set for all the MULT  and CHECK questions by using this command before the first QUESTION block.\n\nON=restore last defined numbering style. OFF=do not number the answer list (the default for questions in a MATRIX block). "1"=number the answer list using digits (the default for questions outside a MATRIX block), starting with the number one. "A"=number the answer list using capital letters, starting with the letter "A." "a"=number the answer list using lower-case letters, starting with the letter "a."\n\nThis command does not affect how answers are coded in the database.' },
   BOLD: { options: '[= ON | OFF*]', suboptions: '', comments: 'Set the emphasis on the question text. ON=use bold font for all question text. OFF=use normal font for all question text (default).\n\nThe BOLD command follows the same behavior as the ALIGN command (see above). For example, all of the question text in a form may be set to use a bold font by putting the BOLD command at the start of your program, before the first question.' },
   COMPUTE: { options: '= (value expression)', suboptions: '', comments: 'Set an expression that will be used to compute the value to a NUMBER question. (NOT IMPLEMENTED.)' },
   COMPUTEIF: { options: '= (test expression) (value expression)', suboptions: '', comments: 'Set an expression that will be used to conditionally compute a value to a NUMBER question if the condition is true. Mulitple COMPUTEIF commands may be used within one question. The system stops evaluating these commands when one has a test expression that is true. (NOT IMPLEMENTED.)' },
   GOTO: { options: '= name', suboptions: '', comments: 'Set a hypertext link from an answer to a MULT or CHECK question to a specific question (by its name). On the web form. The GOTO command must immediately follow the answer text line. Only one GOTO command may be used for one answer text line.' },
   GROUP: { options: '= "label"', suboptions: '', comments: 'When used in an ANSWER list: Insert a label in a MULT, RANDOM, CHECK, NLIST, or SLIST list of answers. One or more GROUP labels may be inserted in one answer list. The label will be inserted in bold at the same location on the web questionnaire form. If the question is displayed using the MATRIX layout, the label will be displayed as a spanning heading over the columns it applies to (i.e., all of the following answers unless another GROUP command is used to define another group of answers).\n\nWhen used in a USER block: Set a GROUP name for this user. GROUP names may be used to let two or more users access the same cases.  (Cases must be preloaded with the GROUP field set (data.q_group) or created by a user who has this name set in his account in order for this sharing to work as expected.'  },
   HIGH: { options: '= (expression)', suboptions: '', comments: 'Set a restriction on the highest value that a user may enter for a NUMBER question. (NOT IMPLEMENTED.)' },
   IF: { options: '=(expression)', suboptions: '', comments: 'Set a conditional link that is used depending upon what answer a user selects to a MULT or CHECK question. (NOT IMPLMENTED.)' },
   LABEL: { options: '= "label"', suboptions: '', comments: 'Set label that will be used when generating SAS or SPSS program variable labels instead of the question text.  If not set, the question text will be used for the SAS or SPSS program value label, up to the limits those programs have on the size of variable labels. This label is not displayed on the web questionnaire form.' },
   LOW: { options: '= (expression)', suboptions: '', comments: 'Set a restriction on the lowest value that a user may enter for a NUMBER question. (NOT IMPLEMENTED.)' },
   NEXT: { options: '[= name]', suboptions: '', comments: 'Define the end of a QUESTION block. The option may be used to create a hypertext link to the next question (by its name) that should be answered (unless this is a MULT or CHECK question which has an answer that was selected by the user and has GOTO link to another a different question).  The skip path created by NEXT and GOTO questions are only enforced on one-page questionnaires.' },
   OPENENDCOLS: { options: '= #', suboptions: '', comments: 'Set the width of an OPENEND answer field. Default is 40 columns. Allowed range is 20 to 100 columns.' },
   OPENENDMAXCHARS: { options: '= #', suboptions: '', comments: 'Set the maximum number of characters that may be entered in an OPENEND answer field. Default is 65,535 characters. Allowed range is 100 to 65,535 characters.  If the maximum is set to a value that is less than 65,535 characters, a label will be displayed immediately below the answer field that shows how many characters have been entered into the field and the maximum number of characters that are allowed. This information is updated as the user types or pastes text into this field.' },
   OPENENDROWS: { options: '= #', suboptions: '', comments: 'Set the height of an OPENEND answer field. Default is seven rows. Allowed range is 1 to 50 rows.' },
   QUESTION: { options: '[= name]', suboptions: '', comments: 'Define the start a QUESTION block. Option may be used to define a name for this question. Name may be from one to 16 characters long, must begin with a letter, and may only contain letters and numbers. The name also must not be a reserved keyword, such as the name of a QPL command (an error will result if the name is reserved). If a name is not defined, it will automatically be created. If the question is visible and numbered, then "Q" plus the visible question number will be used for the name. If it is visible and unnumbered, then "U" plus a sequence number will be used for the name. If the question is hidden, then "H" plus a sequence number will be used for the name. This name is used by other QPL commands, and is used when creating statistical analysis programs. The text lines that follow will be used for the text of the question.' },
   QUESTIONNAIREDB: { options: '= "target db name"', suboptions: '', comments: 'When creating a QUESTIONNAIRE question, this command must be used to set the name of the target database. This name is taken from the target questionnaire QPL program file name. For example, "myproject.pg6" will have a database name of "myproject."' },
   QUESTIONNAIRESTATUS: { options: '= "SQL expression"', suboptions: '', comments: 'When creating a QUESTIONNAIRE question, this command may be used to indicate the status of a case in the target questionnaire. This must be an SQL expression that results in a true or false value, such as "FINISH = 1," where FINISH is the name of question and 1 is its value when a user answers that question to say he has finished that questionnaire. If an expression has been defined and it evaluations to a true value, then the link to it will be displayed in the source questionnaire using bold type.' },
   QUESTIONNAIREURL: { options: '= "target URL"', suboptions: '', comments: 'When creating a QUESTIONNAIRE question, this command must be used to set the location of the target questionnaire. If both questionnaires are located on the same web server in different directories, just the name of the target directory may be used. (Ex.http://www.mydomain.com/project1and http://www.mydomain.com/project2 , then the target may be specified here as "project2." If hosted on different locations, then the full URL to the directory location must be used.' },
   REQUIRED: { options: '[= ON | OFF | HARD | SOFT | (expression) | CLEAR ]', suboptions: '', comments: 'Implements special handling if the user does not answer this question before moving to the next page or exiting the questionnaire. ON=require a response using last REQUIRED setting. OFF=do not implement special handling. HARD=require response before allowing user to leave the question. SOFT=warn user that response is desired, but allow user to leave question without answering. (expression)=enter an SQL statement that, if it returns a true value, makes this a required question. CLEAR=reset special handling to not use an SQL statement. (NOT IMPLEMENTED.)' },
   SKIP: { options: '= #', suboptions: '', comments: 'Create a link to a question using its internal system number. (NOT IMPLEMENTED.)' },
   SKIPIF: { options: '= (expression)', suboptions: '', comments: 'Create a link to a question using an expression (NOT IMPLEMENTED.)' },
   TYPE: { options: '= CHECK | DATE | LDATE | MULT | NLIST  | NUMBER | OPENEND | QUESTIONNAIRE | RANDOM | SDATE | SLIST| STRING | TIME | UPLOAD | VERSION | VOID | XDATE', suboptions: '(see below)', comments: 'Define the type of answer input field that will be used. This command must be used immediately after the QUESTION command. See notes about each type below.' },
   CHECK: { options: '', suboptions: '', comments: 'Create a check-all-that-apply answer list. Each text line after the ANSWER command becomes one answer option with a check box.  Each check-box may be checked by the user.' },
   DATE: { options: '', suboptions: '', comments: 'Create a date answer field (with a calendar that lets a user pick a date). Enter date in yy-mm-dd format (not recommended).' },
   LDATE: { options: '', suboptions: '', comments: 'Create a date answer field (with a calendar that lets a user pick a date). Enter date in yyyy-mm-dd format.' },
   SDATE: { options: '', suboptions: '', comments: 'Create a date answer field (with a calendar that lets a user pick a date). Enter date in yyyy-mm format.' },
   XDATE: { options: '', suboptions: '', comments: 'Create a date answer field (with a calendar that lets a user pick a date).  f date is not set, then system will enter the current date in yyyy-mm-dd format.' },
   MULT: { options: '', suboptions: '', comments: 'Create a multiple-choice answer list. Each text line after the ANSWER command becomes one answer option with a radio button.  The user may only select one answer from the list. User selects answer. Default is last answer in the list unless ANSWER command has been used to change the default. ANSWER=0 sets no answer as the default (but once a user clicks a radio button, the user may not un-click all of the radio buttons). Another answer may be set using its sequence number with the ANSWER command: ANSWER=1 sets the default to the first answer in the list.' },
   RANDOM: { options: '', suboptions: '', comments: 'Create a multiple-choice answer list. Each text line after the ANSWER command becomes one answer option with a radio button.  An answer from this list is randomly selected by the system if an answer has not been selected yet. This question type is normally used while hidden to \'randomize\' text elements in a questionnaire.' },
   NLIST: { options: '', suboptions: '[="SQL statement"  | query name]', comments: 'Create a drop-down list of responses. The user may only select one response from the list. The answer list may be created by either writing a list of answers after the ANSWER command (each line is one answer) or by linking the question to an SQL query (see QUERY command). Store answer in the data base as numeric code. If the answer list is defined locally, the code is a sequence number starting at one.  If the answer list is defined by an SQL query, the code is defined by the VALUE column returned by the query.' },
   SLIST: { options: '', suboptions: '[="SQL statement"  | query name]', comments: 'Create a drop-down list of responses. The user may only select one response from the list. The answer list may be created by either writing a list of answers after the ANSWER command (each line is one answer) or by linking the question to an SQL query (see QUERY command). SLIST=store the answer as a string in the database. If the answer list is defined locally, the answer label itself will be stored in the database. If the answer list is defined by an SQL query, the string is defined by the VALUE column returned by the query.\n\nThe sub-option is used when the list is created by an SQL query. The SQL query statement may be put here inside double quote delimiters, or the query may be put in a QUERY block and then the name of that QUERY block used here.\n\nIf an SQL query is used, the size of the database field must be set using the ANSWER command. If not, the database field size will be determined automatically.' },
   NUMBER: { options: '= ', suboptions: '[="format"]', comments: 'Create a numeric answer field. The respondent will only be allowed to enter digits or a decimal point. Other characters will be ignored.  The size of the field in the database must be set using the ANSWER command or by using a format sub-option. The pound character (#) is used in a format to indicate where digits may be typed. The decimal point (.) is used to define how many decimal places are allowed. Other characters will be used as a label on the left or right side of the answer field on the form. (Ex." ###.# %")' },
   OPENEND: { options: '', suboptions: '', comments: 'Create a multiple-line answer field. By default, the answer field will be 40 columns wide, 7 rows high, and allow up to 65,535 characters to be entered. The OPENENDCOLS, OPENENDROWS, and OPENENDMAXCHARS commands may be used to change these default settings. Extra spaces are automatically trimmed from a response before it is put into the database.' },
   QUESTIONNAIRE: { options: '', suboptions: '', comments: 'Link this questionnaire to another questionnaire.  The answer list is created from the target questionnaire, using its log-in settings, and shows the cases that this respondent may access (including a "[New]" option if the user has no cases in the target questionnaire or is allowed to create multiple new cases in the target questionnaire).  When the user clicks on a link, the current questionnaire web page, including the menu, is replaced with the target questionnaire web page. When the user exits from the target questionnaire, this web page is again displayed and the list is updated as appropriate. If allowed, the user may click on the [New] link any number of times to create new cases in the target questionnaire.\n\nThe QUESTIONNAIREDB command must be used to set the name of the target database.  The QUESTIONNAIREURL command must be used to set the name of the target web site location. And the QUESTIONNAIRESTATUS command may be used to show the status of the target questionnaire case, such as completed or not complete.\n\nAny number of QUESTIONNAIRE questions may be used in one questionnaire. And a target questionnaire may contain QUESTIONNAIRE questions that link to other target questionnaires. Any number of questionnaires may be chained together. A user navigates backwards to the starting questionnaire by exiting a target questionnaire.\n\nA user account will be created automatically in a target questionnaire if it does not already exist. When a user clicks on target questionnaire link, he will be automatically logged out of the questionnaire and logged into the target questionnaire. The reverse happens when he exits the target questionnaire.' },
   STRING: { options: '', suboptions: '[="format"]', comments: 'Create a one-line answer field. Any character, except tabs and carriage returns, may be typed into this field. The maximum number of characters that may be entered must be set using the ANSWER command or in the sub-option format.  The field size may be set from one to 32,000 characters. The asterisk (*) character is used in a format to indicate how many characters may be entered into the field. Other characters will be used as label on the right or left of the answer field on the questionnaire form (Ex. "** State").' },
   TIME: { options: '', suboptions: '', comments: 'Create an answer field that holds the current time. The time will be set each time the user clicks on the field.' },
   UPLOAD: { options: '', suboptions: '= "allowed extension list"', comments: 'Create an answer field that lets the user upload a file to the questionnaire database. The sub-option may be used to restrict the type of file that may be uploaded according to its file name extension. (NOT IMPLEMENTED.) If the sub-option list is not used, then any type of file may be uploaded. There is a limit on the size of the file that may be uploaded. The maximum file size is 1,000 Kb (1 Mb). This limitation may be reduced using the UPLOADMAX command.\n\nAfter a file has been successfully uploaded, the field is replaced with a label that is the name of the uploaded file, file size, and the current date and time.\n\nThe UPLOADOVERWRITE command may be used to let a user replace a file that has already been uploaded.\n\nOnly the name of the uploaded file is stored in the main questionnaire database table, \'data.\' The width of this field is set to 128 characters by default, but may be changed using the ANSWER command.\n\nThe uploaded file itself is stored in a separate database table. A web site administrator may export the uploaded file from the site by going to the user\'s account page.' },
   VERSION: { options: '', suboptions: '', comments: 'Create an answer field in the database that always holds the version number of this questionnaire. The version number used is taken from the text line that is entered after the ANSWER command.  Normally, this question is put in a HIDE block so it is not visible to a user.' },
   VOID: { options: '', suboptions: '', comments: 'Create a question with no answer field. This is normally used to add instructional information to a questionnaire form, such as a lead-in before a group of MATRIX questions. One answer text line may be used and is automatically formatted to match the instruction lines on MULT and CHECK questions.' },
   UPLOADMAX: { options: '= #', suboptions: '', comments: 'Sets the maximum file size, in kilobytes, which may be uploaded by an UPLOAD question. Minimum value is 10Kb. Maximum is 1,000Kb.' },
   UPLOADOVERWRITE: { options: '[= ON | OFF*]', suboptions: '', comments: 'Sets the behavior of the UPLOAD question. ON=let a user replace a previously uploaded file with another file. OFF=only let a user upload one file (default).' },
   WIDTH: { options: '= #', suboptions: '', comments: 'Set the width of question text area in pixels. Question text will be wrapped within this space.  Using the WIDTH command without an argument resets the current value to the appropriate default for a question in a normal, matrix, or columns layout.\n\nFor questions using a normal layout, the default width is 490 pixels.  The maximum value that may be set is limited by the space available, according to the current page size setting less the space needed for the menu (if it is used).\n\nFor questions in a MATRIX block, the default width is 250 pixels. The maximum width available is half the space available to questions that use a normal layout (in order to provide space for the answer fields which are display on the same row of the MATRIX). Using the WIDTH command immediately after the start of a MATRIX block sets the question width for all the questions in that block.\n\nFor questions in a COLUMNS block, the default action is to equally divide the available space among columns in the block. WIDTH commands may be used inside each of the questions in the first row to change the default setting for its entire column. When used inside a POPUP block, the WIDTH command sets width of the POPUP browser window in pixels. Default is 300 pixels. Using WIDTH without an argument resets it to the default size.' },
   STYLE: { options: '[= ON | OFF]', suboptions: '', comments: 'Add custom CSS styles to this project. CSS styles may be add in text lines after the STYLE command is set to ON. The styles end when the STYLE command is set to off. These styles will applied to both the questionnaire pages and the administrative pages after the standard QPL styles. These styles are put into the file called "qpl_style_local.css."' },
   ARCHIVEDATE: { options: '= YYYY-MM-DD', suboptions: '', comments: 'Date that the project should be archived. This is only used by web server administrators to track live projects. It does not affect the operation of a project.' },
   AUTHOR: { options: '= "name"', suboptions: '', comments: 'Name of project author. This is only used by the web server administrators to track live projects. It does not affect the operation of a project.' },
   CARD: { options: '= #', suboptions: '', comments: 'Set the maximum data card size that is used when exporting a fixed-format data file (.dat) from the main administrative web page. Default is 250 columns.' },
   ENGINE: { options: '= "MySQL engine name"', suboptions: '', comments: 'Change the database engine that will be used for the MySQL database that supports this project. Default is "MYISAM." May be set to any engine that is installed on your server, such as "INNODB."' },
   INCLUDE: { options: '= "file name"', suboptions: '', comments: 'Insert another QPL program file (.pg6) at this point in the current QPL program.' },
   LIVEUPDATE: { options: '[= ON* | OFF ]', suboptions: '', comments: 'Automatically update a question response to database on the server when the answer field loses focus (i.e., the user moves the cursor to another question\'s answer field). Default is ON.  This database update is done in addition to the database update that occurs for all the fields on a questionnaire page when the Next, Previous, Exit, or Submit buttons are pressed by the user.' },
   NEWCARD: { options: '', suboptions: '', comments: 'When exporting a fixed format data file, this command starts writing the data for the next question on a new data card.' },
   VERBOSE: { options: '= ON | OFF*', suboptions: '', comments: 'Modify the display of error messages from the QPL compiler. ON=show all error messages. OFF=show only the first error found in a QUESTION block (default). These messages are displayed on the screen when running the program from the console, and they are copied to a text file that has the same name as the QPL program (i.e., .pg6) file but with the file name extension changed to ".err".' },
   EMAIL: { options: '=name@domain.com', suboptions: '', comments: 'Set an email address for this user. This address is used when sending email messages to users from the web site.' },
   EXPIRE: { options: '= YYYY-MM-DD', suboptions: '', comments: 'Set an expiration date for this user\'s account. This setting only affects Normal and Superuser accounts.' },
   NAME: { options: '= "name"', suboptions: '', comments: 'Set the friendly name of this user.  This is used by an administrator when looking up an account. It may also be embedded in an email message that is sent from the web site to personalize the message.' },
   PASSWORD: { options: '= "password"', suboptions: '', comments: 'Set this user\'s password. The password should be at least five characters  long, include letters and numbers, and not be a real word. The password is not case-sensitive. If the PASSOWORD command is not used, the system will automatically generate a five-digit random number for the password. An administrator may look up a user\'s password on the web site.' },
   PHONE: { options: '= "###-###-####"', suboptions: '', comments: 'Set the phone number of this user.  This is used only for the convenience of the administrators when they are working to manage user accounts.' },
   STATUS: { options: '= CLOSED* | NORMAL | SUPERUSER | MANAGER | ADMIN | DATAADMIN', suboptions: '', comments: 'Set  the type of account this user will have. CLOSED=the account exists but does not let the user access anything (default). NORMAL=this account lets the user access one or more questionnaire forms. Exactly what cases a Normal user may access is controlled by the project log in settings, his user name, and his GROUP name (if one has been set). SUPERUSER=user may access any case. MANAGER=user may access administrative pages on the site to see only project status and report information. ADMIN=user may access administrative pages to see MANGER-level information plus administer user accounts and assign content analysis tags to open-ended responses. DATAADMIN=user may acces administrative pages to access ADMIN-level information plus may export data from the web site.' },
   USER: { options: '[= ON | name | OFF]', suboptions: '', comments: 'Define a USER account block. One user account block creates one user account. Text lines inside the block are used to fill the Comment field for the account.\n\nON=start USER account block and create a user name with the prefix, "user," plus a sequence number that starts at one. Username=start USER account block and use "name" for the account user name. OFF=end USER account block.\n\nOther optional commands may be used inside a USER block to set other account information. See EMAIL, EXPIRE, GROUP, NAME, and PASSWORD commands.' }
   };
  
  
  ko.views.manager.currentView.setFocus();
  var MyWord = ko.interpolate.getWordUnderCursor().toUpperCase();
  
  if (Info[MyWord]) {
      qplLog("Keyword: " + MyWord + "\nOptions: " + Info[MyWord].options + "\nSub-options: " + Info[MyWord].suboptions + "\n\n" + WordWrap("Comments: " + Info[MyWord].comments), false );
  } else {
      qplLog("Keyword '" + MyWord + "' not known.", false);
  }
  
}