"use strict";

// qplwrapper.js

const Cc = Components.classes, Ci = Components.interfaces;
const MY_ID = "kevin@respondemeum.com";
const MY_PREF_EXT = "extensions.qplwrapper.";
const MY_PROJECT = "qpl_last_project";
const MY_CUSTOM_OPTIONS = "qpl_options_custom"
const MY_OS_PREF = "extensions.qplwrapper.qpl_os_pref";
const MY_SVN_PREF = "extensions.qplwrapper.qpl_subversion_repository";
const MY_SVN_USER = "extensions.qplwrapper.qpl_subversion_repository_user";
const MY_SVN_PASSWORD = "extensions.qplwrapper.qpl_subversion_repository_password";

const MY_SVN2_PREF = "extensions.qplwrapper.qpl_subversion_repository2";
const MY_SVN2_USER = "extensions.qplwrapper.qpl_subversion_repository2_user";
const MY_SVN2_PASSWORD = "extensions.qplwrapper.qpl_subversion_repository2_password";

const MY_WORKING_DIR = "extensions.qplwrapper.qpl_working_directory";
const MY_JOBTRACKER_URL = "extensions.qplwrapper.qpl_jobtracker_url";
const MY_JOBTRACKER_AJAX = "komodo.php";

const MY_SAMPLES = "chrome://qplwrapper/content/samples";

const DEFAULT_EXTENSION = "pg6";

var DefaultExtensionMatch = /\.pg6$/;
var ValidSourceNameMatch = /^[a-z][_a-z0-9]{,15}$/;

var SB = document.getElementById('qplwrapper-strings');
var QPLWrapper = SB.getString('QPLWrapper');
var SelFolder = SB.getString('SelFolder');
var SelFile = SB.getString('SelFile');
var CreateFolder = SB.getString('CreateFolder');
var InvalidProjectName = SB.getString('InvalidProjectName');
var InvalidProjectTitle = SB.getString('InvalidProjectTitle');
var UnpackingFiles = SB.getString('UnpackingFiles');
var CreateProjectFile = SB.getString('CreateProjectFile');
var CreateProjectFileError = SB.getString('CreateProjectFileError');
var ProjectCreated = SB.getString('ProjectCreated');
var SelectFolderAndName = SB.getString('SelectFolderAndName');
var SelectProjectFileFirst = SB.getString('SelectProjectFileFirst');
var NotAPG6 = SB.getString('NotAPG6');
var ErrorCount = SB.getString('ErrorCount');
var ExeIsMissing = SB.getString('ExeIsMissing');
var ExeNotExecutable = SB.getString('ExeNotExecutable');
var SvnFolderExists = SB.getString('SvnFolderExists');
var WorkingFolderExists = SB.getString('WorkingFolderExists');
var WorkingFolderMissing = SB.getString('WorkingFolderMissing');
var SvnNewProjectInitialImport = SB.getString('SvnNewProjectInitialImport');
var SvnImportError = SB.getString('SvnImportError');
var SvnInitialCommit = SB.getString('SvnInitialCommit');
var SvnReCommit = SB.getString('SvnReCommit');
var SvnNotWorkingFolder = SB.getString('SvnNotWorkingFolder');
var CreateProject = SB.getString('CreateProject');
var SelectSVNProject = SB.getString('SelectSVNProject');
var LookingForQPLFiles = SB.getString('LookingForQPLFiles');
var QPLFilesAlreadyCheckedOut = SB.getString('QPLFilesAlreadyCheckedOut');
var JobTrackerURLNotSet = SB.getString('JobTrackerURLNotSet');
var CompileFailure = SB.getString('CompileFailure');
var CurrentWorkingDirectory = SB.getString('CurrentWorkingDirectory');
var SvnRepo1 = SB.getString('SvnRepo1');
var SvnRepo2 = SB.getString('SvnRepo2');


function GetContentPath() // list each subdirectory and the file name as separate arguments to drill down...
{
    var directoryService = Components.classes["@mozilla.org/file/directory_service;1"]
	.getService(Components.interfaces.nsIProperties);
    var file = directoryService.get("ProfD", Components.interfaces.nsIFile);

    file.append("extensions");
    file.append(MY_ID);
    file.append("content");

    for (var i = 0; i < arguments.length; i++) {
	file.append(arguments[i])
    }
    return file;
}




function CreateNewProject2(ko, title, name, versioning, versioning2, MyLanguageCodes, MyLanguageNames) {
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	.getService(Components.interfaces.nsIPromptService);
    var Target = Components.classes["@mozilla.org/file/local;1"]
	.createInstance(Ci.nsILocalFile);
    var prefManager = Components.classes["@mozilla.org/preferences-service;1"]
	.getService(Components.interfaces.nsIPrefBranch);
    var zipReader = Components.classes["@mozilla.org/libjar/zip-reader;1"]
	.createInstance(Ci.nsIZipReader);
    var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
	.createInstance(Ci.nsIFileInputStream);
    var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"]
	.createInstance(Components.interfaces.nsIConverterInputStream);
    var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
	.createInstance(Ci.nsIFileOutputStream);
    var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"]
	.createInstance(Ci.nsIConverterOutputStream);
    var thread = Components.classes["@mozilla.org/thread-manager;1"]
	.getService(Components.interfaces.nsIThreadManager)
	.currentThread;


    var AddToVersionControl = document.getElementById(versioning).checked;
    var UseSecondaryRepository = document.getElementById(versioning2).checked;
    
    var ProgressMeter = document.getElementById('qpl_progress');
    //ProgressMeter.mode = "undetermined";
    ProgressMeter.style.display="block";
    
    var SvnExecutable = GetSvnPath();
    
    var SvnPath = prefManager.getCharPref(MY_SVN_PREF);
    if (UseSecondaryRepository) {
	SvnPath = prefManager.getCharPref(MY_SVN2_PREF);
    }
    
    var MyTitle = document.getElementById(title);
    MyTitle.value = MyTitle.value.trim();
    if (MyTitle.value.length == 0 && AddToVersionControl) {
	qplLog(InvalidProjectTitle, false);
	return 1;
    }

    var MyName = document.getElementById(name);
    MyName.value = MyName.value.replace(/ /g, "");
    MyName.value = MyName.value.toLowerCase();
    if ( ! /^[a-z][_a-z0-9]{4,23}$/.test( MyName.value)) {
	qplLog(InvalidProjectName, false);
	return 1;
    }

    var MyFolder = prefManager.getCharPref(MY_WORKING_DIR);
    if (MyFolder.length == 0) {
	qplLog(SelectFolderAndName, false);
	return 1;
    }

    Target.initWithPath(MyFolder);
    Target.append(MyName.value);
    qplLog(CreateProject + " " + Target.path , false); // clear command output window

    ProgressMeter.value = 10;
    thread.processNextEvent(true);
    
    // Add new JobTracker record
    var JobTrackerURL = prefManager.getCharPref(MY_JOBTRACKER_URL).trim();
    if (JobTrackerURL.length) {
	if (AddToVersionControl) {
	    var postInfo = "q_task=add&PROJNAME=" + MyName.value + "." + DEFAULT_EXTENSION + "&SSNAME=" + MyName.value + "&JOBTITLE=" + encodeURIComponent(MyTitle.value);
	    var Debug = false;
	    if (!postJobTrackerInfo(postInfo, Debug)) {
		return 1;
	    }
	}
    }


    ProgressMeter.value = 20;
    thread.processNextEvent(true);

    
/*
 *		add this local project folder to Subversion repository if it doesn't already exist...
 *
 *		svn ls REPOSITORY/Target.leafName - - if return code is 0 then project doesn't exist
 *		svn import Target.path REPOSITORY - - creates empty location on REPOSITORY server
 *		svn checkout REPOSITORY/Target.leafName - - check out empty project to create .svn folder
 *		... unpack zip files and make .pg6
 *		... make Target.path the current working directory
 *		svn add *   - - add files to .svn
 *		svn commit -m "Initial commit"    - - send files to server

alert("Project name: leafName: " + Target.leafName +
      "\nProject path: " + Target.path);
 */

    if (AddToVersionControl) {
	if (!svnProjectExists(Target.leafName, SvnPath)) {
	    // Project does not already exist, ok to proceed...importing empty directory...
	    if (!Target.exists()) {
		Target.create(1, 509);	//  0775 = 509 create project directory with rwxrwxr-x
	    } else {
		qplLog(CreateProjectFileError, true);
		return 1;
	    }
	    
	    if (qplRun(SvnExecutable + " import \"" + Target.path + "\" \"" + SvnPath + "/" + Target.leafName + "\" -m \"" + Target.leafName + ": " + SvnNewProjectInitialImport + "\" --non-interactive",
		Target.path,
		"",
		"",
		true)) {
		qplLog(SvnImportError, true);
		return 1;
	    } else { // checking out empty directory to create local .svn directory
		if (qplRun(SvnExecutable + " checkout " + SvnPath + "/" + Target.leafName + " \"" + Target.path + "\" --non-interactive",
		    Target.path,
		    "",
		    "",
		    true)) {
		    qplLog(SvnImportError + " (2)", true);
		    return 1;
		}
	    }
	} else {
	    qplLog(SvnFolderExists, true);
	    return 1;
	}
    } else {
	if (!Target.exists()) {
	    Target.create(1, 509);	//  0775 = 509 create project directory with rwxrwxr-x
	} else {
	    qplLog(CreateProjectFileError, true);
	    return 1;
	}	    
    }
    
    ProgressMeter.value = 30;
    thread.processNextEvent(true);

    var Target2 = Target.clone();
    Target2.append("email");
    Target2.create(1, 509);	//  0775 = 509 create email directory with rwxrwxr-x
    Target2 = Target.clone();
    Target2.append("product");
    Target2.create(1, 509);	//  0775 = 509 create product directory with rwxrwxr-x
    Target2 = Target.clone();
    Target2.append("analysis");
    Target2.create(1, 509);	//  0775 = 509 create analysis directory with rwxrwxr-x

    qplLog(UnpackingFiles, true);
    ProgressMeter.value = 40;
    thread.processNextEvent(true);

    // find master zip file. Important! Zip file should be created on Linux with correct file permissions. Zips from Windows don't set file permissions correctly.

    var qpl_master_files = GetContentPath("lib", "qpl_master_files.zip");
    var qpl_master_program = GetContentPath("lib", "qpl_default_program.pg6");

    zipReader.open(qpl_master_files);
    zipReader.test(null);

    // now create files

    var entries = zipReader.findEntries(null);

    while (entries.hasMore()) {
	var entryName = entries.getNext();
	var itemLocation = Target.clone();
	var parts = entryName.split("/");

	for (var i = 0; i < parts.length; ++i)
	    itemLocation.append(parts[i]);

	zipReader.extract(entryName, itemLocation);
    }
    zipReader.close();

	
    // Now make a .pg6 file for each language and open it...
    
    qplLog(CreateProjectFile, true);
    var FileList = [];
    ProgressMeter.value = 50;
    thread.processNextEvent(true);
	
    if (MyLanguageCodes.length == 0) {
	MyLanguageCodes[0] = "";
	MyLanguageNames[0] = "";
    }

    
    for (var l = 0; l < MyLanguageCodes.length; l++) {
	// See code snippets... https://developer.mozilla.org/en/Code_snippets/File_I%2f%2fO
	// open an input stream from file (0444 octal = 0x0124)
	
	istream.init(qpl_master_program, 0x01, 0x0124, 0);
	cstream.init(istream, "UTF-8", 0, 0);
	cstream.QueryInterface(Ci.nsIUnicharLineInputStream);
	//istream.QueryInterface(Ci.nsILineInputStream);

	// open an output stream
	var OutFile = Target.clone();
	OutFile.append(MyName.value + "." + DEFAULT_EXTENSION + (MyLanguageCodes[l].length ? "." + MyLanguageCodes[l] : "") );
	FileList[l] = OutFile.path;

	// file is nsIFile, data is a string

	// use 0x02 | 0x10 to open file for appending. ( 0666 octal = 0x01b6)
	foStream.init(OutFile, 0x02 | 0x08 | 0x20, 0x01b6, 0);
	// write, create, truncate
	// In a c file operation, we have no need to set file mode with or operation,
	// directly using "r" or "w" usually.

	foStream.write('\u00EF\u00BB\u00BF', 3); //write UTF-8 BOM
	converter.init(foStream, "UTF-8", 0, 0);

	var line = {}, hasmore, blank = "                                                                                   ";
	var today = new Date();
	do {
	    hasmore = cstream.readLine(line);
	    if (/PROGRAM:/.test(line.value)) {
		line.value = "** PROGRAM: " + OutFile.leafName;
		line.value += blank.substring(1, 60 - line.value.length);
		line.value += "DATE: " + today.toLocaleDateString() ;
		if (MyLanguageCodes[l].length) { 
		    converter.writeString(line.value + "\n");
		    line.value = "** LANGUAGE: " + MyLanguageNames[l] + "(" + MyLanguageCodes[l] + ")";
		}
	    }

	    if (/TITLE:/.test(line.value)) {
		line.value = "**   TITLE: " + MyTitle.value;
	    }
	    
	    if (/AUTHOR:/.test(line.value)) {
		line.value = "**  AUTHOR: " + GetUserName();
	    }
	    
	    if (/\.TITLE/.test(line.value) &&  MyLanguageCodes[l].length ) {
		line.value = ".TITLE = \"" + MyLanguageNames[l] + "\"";
	    }

	    if (/\.HELLO/.test(line.value) &&  MyLanguageCodes[l].length) {
		converter.writeString(line.value + "\n");
		
		converter.writeString("\\<div id\\=\\\"LanguageMenu\\\"\\>\n");
		for (var m = 0; m < MyLanguageCodes.length; m++) {
		    converter.writeString("\\<a name\\=\\\"Language\\\" " + (l == m ? "class\\=\\\"LanguageOn\\\" " : "") + " href\\=\\\"index.htm." + MyLanguageCodes[m] + "\\\"\\>" + MyLanguageNames[m] + "\\</a\\>\n");
		}
		line.value = "\\</div\\>\n";
	    }

	    converter.writeString(line.value + "\n");

	} while (hasmore);

	
	cstream.close();

	converter.close(); // this closes foStream

	qplLog(OutFile.leafName + " " + ProjectCreated + " " + Target.path, true);
    }
    ProgressMeter.value = 60;
    thread.processNextEvent(true);

    if (AddToVersionControl) {
	qplLog("\n" + SvnReCommit + "..\n", true);
	thread.processNextEvent(true);
	ProgressMeter.mode = 'undetermined';
	thread.processNextEvent(true);

	if (qplRun(SvnExecutable + " add * --non-interactive",
	    Target.path,
	    "",
	    "",
	    true)) {
	    qplLog(SvnImportError + " (3)", true);
	    return 1;
	} else {
	    if (qplRun(SvnExecutable + " propset svn:needs-lock \"on\" *.pg6* --non-interactive",
		Target.path,
		"",
		"",
		true)) {
		qplLog(SvnImportError + " (4)", true);
		return 1;
	    } else {
		if (qplRun(SvnExecutable + " commit -m \"" + SvnInitialCommit + "\" --non-interactive",
		    Target.path,
		    "",
		    "",
		    true)) {
		    qplLog(SvnImportError + " (5)", true);
		    return 1;
		} else {
		    if (qplRun(SvnExecutable + " lock *.pg6* --non-interactive",
			Target.path,
			"",
			"",
			true)) {
			qplLog(SvnImportError + " (6)", true);
			return 1;
		    }
		}
	    }
	}
    }

    ProgressMeter.value = 80;
    ProgressMeter.mode = 'determined';
    thread.processNextEvent(true);

    // Open .pg6 files in Komodo    
    for (var m = 0; m < FileList.length; m++) {
	ko.open.URI(FileList[m]);
	ko.views.manager.currentView.setFocus();
    }

    ProgressMeter.value = 100;
    thread.processNextEvent(true);
    
    SetPlace(ko, Target.path);

    return 0;
}



function BuildProject2(ko, files, options, view, absoluteview, compileoption) {
    var Target = Components.classes["@mozilla.org/file/local;1"]
	.createInstance(Ci.nsILocalFile);
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	.getService(Components.interfaces.nsIPromptService);
    var ErrorLogFile = Components.classes["@mozilla.org/file/local;1"]
	.createInstance(Ci.nsILocalFile);
    var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"]
	.createInstance(Ci.nsIFileInputStream);
    var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"]
	.createInstance(Ci.nsIConverterInputStream);
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
	.getService(Ci.nsIPrefService).getBranch(MY_PREF_EXT);
    var koDoc = ko.views.manager.currentView.koDoc;
    var Display = Components.classes["@mozilla.org/file/local;1"].
	createInstance(Ci.nsILocalFile);

    var qpl_compile = Components.classes["@mozilla.org/file/local;1"]
	.createInstance(Ci.nsILocalFile);
    qpl_compile.initWithPath(GetExePath("qpl_compile"));
    if (!qpl_compile.exists()) {
	prompts.alert(window, QPLWrapper, "Missing: " + GetExePath("qpl_compile"));
	return 1;
    }
    var process = Components.classes["@mozilla.org/process/util;1"]
	.createInstance(Ci.nsIProcess);
    process.init(qpl_compile);

    var qpl_convert = Components.classes["@mozilla.org/file/local;1"]
	.createInstance(Ci.nsILocalFile);
    qpl_convert.initWithPath(GetExePath("qpl_convert"));
    if (!qpl_convert.exists()) {
	prompts.alert(window, QPLWrapper, "Missing: " + GetExePath("qpl_convert"));
	return 1;
    }
    var process2 = Components.classes["@mozilla.org/process/util;1"]
	.createInstance(Ci.nsIProcess);
    process2.init(qpl_convert);

    qplLog("Processing " + files.length + " files.", false);
    ko.commands.doCommand('cmd_saveAll');
    
// loop through files starting here
    if (files.length == 0) {
	files[0] = options[0];
    }
    
    for (var f = 0; f < files.length; f++) {
	options[0] = files[f];
	qplLog("+++++ " + (f+1) + ". " + options[0] + " +++++", true);
	
	try {
	    Target.initWithPath(options[0]);
	} catch (e) {
	    prompts.alert(window, QPLWrapper, SelectProjectFileFirst + "\n" + options[0]);
	    return 1;
	}
    
	if (!Target.exists()) {
	    prompts.alert(window, QPLWrapper, SelectProjectFileFirst + "\n" + options[0]);
	    return 1;
	}
    
	// redirect qpl_convert stdout to qpl_convert_results.txt with the -o option
	var Options = [];
	var i = 0;
	Options[i++] = "-o";
	Options[i++] = Target.path.substr(0, Target.path.length - Target.leafName.length) + "qpl_convert_results.txt";
	for (var j = 0; j < options.length; j++) {
	    Options[i++] = options[j];
	}
    
	var argv = [Target.path];
 
	if (compileoption != null) {
	    if (compileoption.length)
		argv[argv.length] = compileoption;
	}
	
	var Run = "qpl_compile ";
	for (var r = 0; r < argv.length; r++) {
	    Run += argv[r] + " ";
	}
	qplLog(Run, true);
	
	try {
	    process.run(true, argv, argv.length);
	} catch(e) {
	    alert(e);
	}
    
	qplLog(ErrorCount + " " + process.exitValue, true);
    
	// display error log results...
    
	ErrorLogFile.initWithPath(Target.path.replace(/\.pg6(\.[a-z]+)?$/, ".err"));
    
	if (!ErrorLogFile.exists()) {
	    prompts.alert(window, QPLWrapper, "Missing\n" + ErrorLogFile.path);
	    return ("");
	}
    
	fstream.init(ErrorLogFile, -1, 0, 0);
	cstream.init(fstream, "UTF-8", 0, 0); // you can use another encoding here if you wish
    
	let(str = {}) {
	    cstream.readString(-1, str); // read the whole file and put it in str.value
	    qplLog(str.value, true);
	    
	    var ErrLineNum = 0, ErrLineList = [];
	    var ErrList = str.value.split(/[\r\n]/);
	    for (var i in ErrList) {
		if (/^[0-9]+:/.test(ErrList[i])) {
		    ErrLineNum = ErrList[i].split(":");
		    ErrLineList.push(ErrLineNum[0] - 1);
		}
	    }
	}
	cstream.close(); // this closes fstream
    
	// if no errors, then run the converter...
	ko.views.manager.currentView.setFocus();
	ko.commands.doCommand('cmd_bookmarkRemoveAll');
    
	if (process.exitValue == 0) {
	    process2.run(true, Options, Options.length);

	    qplLog(ErrorCount + " " + process2.exitValue, true);

	    ErrorLogFile.initWithPath(Options[1]); // get qpl_convert stdout file which has notes about what was created...

	    fstream.init(ErrorLogFile, -1, 0, 0);
	    cstream.init(fstream, "UTF-8", 0, 0);
	    let(str = {}) {
		cstream.readString(-1, str); // read the whole file and put it in str.value
		qplLog(str.value, true);
	    }
	    cstream.close(); // this closes fstream
	} else {	// bookmark the lines with errors

	    for (var i in ErrLineList) {
		if (i > 0) {
		    if (ErrLineList[i] > ErrLineList[i-1]) {
			ko.views.manager.currentView.scimoz.gotoLine(ErrLineList[i]);
			ko.commands.doCommand('cmd_bookmarkToggle');
		    }
		} else {
		    ko.views.manager.currentView.scimoz.gotoLine(ErrLineList[i]);
		    ko.commands.doCommand('cmd_bookmarkToggle');
		}
	    }
	    ko.views.manager.currentView.scimoz.gotoLine(ErrLineList[0]);
	    prompts.alert(window, QPLWrapper, CompileFailure);
	    return 1;
	}

	if (process2.exitValue == 0) {
	    // update preferences...
	    prefs.setComplexValue(MY_PROJECT, Ci.nsILocalFile, Target);
	} else {
	    return 1;
	}

	if (absoluteview) {
	    try {
		if (/\.htm/.test(absoluteview)) {
		    ko.open.URI(absoluteview, 'browser');
		} else {
		    ko.open.URI(absoluteview);
		}
		ko.views.manager.currentView.setFocus();

	    } catch (e) {
		alert(e);
	    }
	} else if (view) {
	    Display.initWithPath(Target.path.replace(/[a-z][_a-z0-9]+\.pg6/, view));
	    
	    try {
		    ko.open.URI(Display.path, 'browser');
		    ko.views.manager.currentView.setFocus();
	    } catch (e ) {
		alert(e);
	    }
	}
    }
    var views = ko.views.manager.topView.getViewsByType(true, 'browser');	// reload all browser windows in case something changed!
    for (var i = 0; i < views.length; i++) {
	views[i].reload();
    }
    
    AddSvnNewFiles(ko.views.manager.currentView.koDoc.file.dirName);

    return 0;
}



function svnCommitProject(ko, Repo)
{
    var Target = Components.classes["@mozilla.org/file/local;1"]
	.createInstance(Ci.nsILocalFile);
    var prefManager = Components.classes["@mozilla.org/preferences-service;1"]
	.getService(Components.interfaces.nsIPrefBranch);
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	.getService(Components.interfaces.nsIPromptService);


    var SvnExecutable = GetSvnPath();
    var ProjectDirectory = ko.views.manager.currentView.koDoc.file.dirName;
    var Pg6Name = ko.views.manager.currentView.koDoc.file.baseName;
    var ProjectName = Pg6Name.substr(0, Pg6Name.search(/\.pg6/));
    ProjectName = ProjectName.toLowerCase();
    ProjectName = ProjectName.replace(/ /g, "");
    
    if (Repo) {
	var SvnPath = prefManager.getCharPref(MY_SVN2_PREF);//code
    } else {
	var SvnPath = prefManager.getCharPref(MY_SVN_PREF);
    }
    
    
    var Comment = document.getElementById('qpl_commit_comment').value;
    if (Comment.length) {
	Comment = Comment.replace(/"/g, "'");
    } else {
	Comment = SvnReCommit;
    }    
    
    var os = prefManager.getCharPref(MY_OS_PREF); 
    var MyFolder = prefManager.getCharPref(MY_WORKING_DIR);
    Target.initWithPath(MyFolder);
    Target.append(ProjectName);

    
    qplLog(SvnReCommit, false);
    ko.commands.doCommand('cmd_saveAll');
    ko.commands.doCommand('cmd_closeAll');
    // ko.commands.doCommand('cmd_bufferClose');	// just close this window
    
    ko.open.URI("http://qpl.gao.gov", "browser");

    if (qplRun(SvnExecutable + " info --non-interactive",
		    ProjectDirectory,
		    "",
		    "",
		    false)) {	// not a working directory, add to version control...

	qplLog(SvnNotWorkingFolder, true);
	
	if (!svnProjectExists(ProjectName, SvnPath)) {
	    
	    if (Pg6Name.indexOf(ProjectName) < 0) {
		if (os == 'win32') {
    
			qplRun("RENAME \"" + ProjectDirectory + "\\" + Pg6Name + "\" \"" + ProjectName + ".pg6\"",
			    "",
			    "",
			    "",
			    true);
    
		} else {
			
			qplRun("mv \"" + ProjectDirectory + "/" + Pg6Name + "\" \"" + ProjectDirectory + "/" + ProjectName + ".pg6\"",
			    "",
			    "",
			    "",
			    true);
		}
	    }
	    
	    qplLog(ProjectName + ": " + SvnNewProjectInitialImport, true);
	    	    
	    if (qplRun(SvnExecutable + " import \"" + ProjectDirectory + "\" \"" + SvnPath + "/" + ProjectName + "\" -m \"" + ProjectName + ": " + SvnNewProjectInitialImport + " - " + Comment + "\" --non-interactive",
		ProjectDirectory,
		"",
		"",
		true)) {
		qplLog(SvnImportError, true);
		return 1;
	    } else {
		
		if (os == 'win32') {
		    // rename [directory] [new leaf name]
		    
		    var Path = ProjectDirectory.split("\\");
		    
		    qplRun("RENAME \"" + ProjectDirectory + "\" \"" + Path[Path.length - 1] + ".old\"",
			"",
			"",
			"",
			true);

		} else {
		    // mv [directory] [directory]+".old"
		    
		    qplRun("mv \"" + ProjectDirectory + "\" \"" + ProjectDirectory + ".old\"",
			"",
			"",
			"",
			true);
		}
		
		
		if (!Target.exists()) {
		    Target.create(1, 509);	//  0775 = 509 create project directory with rwxrwxr-x
		} else {
		    qplLog(CreateProjectFileError, true);
		    return 1;
		}
		
		
		if (qplRun(SvnExecutable + " checkout " + SvnPath + "/" + ProjectName + " --non-interactive",
		    MyFolder,
		    "",
		    "",
		    true)) {
		    qplLog(SvnImportError + " (2)", true);
		    return 1;
		} else {
		    if (qplRun(SvnExecutable + " propset svn:needs-lock \"on\" *.pg6* --non-interactive",
			Target.path,
			"",
			"",
			true)) {
			qplLog(SvnImportError + " (4)", true);
			return 1;
		    } else {
			if (qplRun(SvnExecutable + " commit -m \"" + SvnInitialCommit + "\" --non-interactive",
			    Target.path,
			    "",
			    "",
			    true)) {
			    qplLog(SvnImportError + " (5)", true);
			    return 1;
			}
		    }
		}
		return 0;
	    }
	} else {
	    qplLog(SvnFolderExists, true);
	    return 1;
	}

	return 0;
    }
    
    
    qplRun(SvnExecutable + " update --accept mine-conflict --non-interactive",
		    ProjectDirectory,
		    "",
		    "",
		    true);
    
    AddSvnNewFiles(ProjectDirectory);
    
    qplRun(SvnExecutable + " unlock *.pg6* --non-interactive",
		    ProjectDirectory,
		    "",
		    "",
		    true);
    
    qplRun(SvnExecutable + " commit -m \"" + Comment + "\" --non-interactive",
		    ProjectDirectory,
		    "",
		    "",
		    true);
    
    qplRun(SvnExecutable + " status -u --non-interactive",
		    ProjectDirectory,
		    "",
		    "",
		    true);
    
    
    SetPlace(ko, MyFolder);
    
    return 0;
}



// finds the correct qpl executable according to the preferences OS selection.

function GetExePath(name) {
    var prefManager = Components.classes["@mozilla.org/preferences-service;1"]
	.getService(Components.interfaces.nsIPrefBranch);

    var os = prefManager.getCharPref(MY_OS_PREF); // get os preference string which maps to the /bin/<os> location of the executable!

    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	.getService(Components.interfaces.nsIPromptService);

    var file = GetContentPath("bin", os);

    if (os == 'win32')
	file.append(name + ".exe");
    else
	file.append(name);

    if (!file.exists()) {
	prompts.alert(window, QPLWrapper, ExeIsMissing + "\n" + file.path);
	return ("");
    }

    //if (!file.isExecutable())	// Doesn't work on mac see https://bugzilla.mozilla.org/show_bug.cgi?id=322865
    //{
    //	prompts.alert(window, QPLWrapper, ExeNotExecutable + "\n" + file.path);
    //	return("");
    //}
    return (file.path);
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


function CheckSVNConnection(SvnPath) {
    var runSvc = Components.classes["@activestate.com/koRunService;1"]
	.getService(Components.interfaces.koIRunService);

    var SubversionPassword=GetLocalizedMessage('SubversionPassword');
    var SubversionPasswordCanceled=GetLocalizedMessage('SubversionPasswordCanceled');
    
    var Account = GetAccount(SubversionPassword);
    
    if (!Account.status) {
	qplLog(SubversionPasswordCanceled, false);
	return false;
    }

    var SvnExecutable = GetSvnPath();
    
    // Note: Subversion repository server configuration file (svnserve.conf) must not
    // allow anonymous access (anon-access = none) so that the password entered here
    // will be cached locally on the user's machine even when doing this read-only 'list'
    // command. Also useful to set user's local Subversion configuration to encrypt
    // the cached password (cryptoapi on Windows).
    
    var cmd = SvnExecutable + " list " + SvnPath;
    if (Account.user.length) {
	cmd += " --username " + Account.user;
    }
    if (Account.password.length) {
	cmd += " --password " + Account.password;
    }
    if (Account.user.length || Account.password.length) {
	cmd += " --non-interactive --trust-server-cert";
    }
    var cwd = "";
    var env = "";
    var input = "";
    var o_output = new Object();
    var o_error = new Object();

    var ExitCode = runSvc.RunAndCaptureOutput(cmd, cwd, env, input, o_output, o_error);
    var Projects = "\nProject list...\n";
    if (ExitCode == 0) {
	var List = o_output.value.split("/");
	for (var i = 0; i < List.length; i++) {
	    Projects += List[i];
	    if (i > 5) {
		Projects += "\n...\n";
		break;
	    }
	}
    }

    var Message = "Command: " + cmd + "\n" +
	(ExitCode == 0 ? "OK\n" + Projects : "Error (" + ExitCode + ") - " + o_error.value) + "\n";

    qplLog(Message, false);

    return true;
}


function CheckQPLConnection() {
    var QplPath = GetExePath("qpl_compile");

    var runSvc = Components.classes["@activestate.com/koRunService;1"]
	.getService(Components.interfaces.koIRunService);

    var cmd = "\"" + QplPath + "\" -?";
    var cwd = "";
    var env = "";
    var input = "";
    var o_output = new Object();
    var o_error = new Object();

    var ExitCode = runSvc.RunAndCaptureOutput(cmd, cwd, env, input, o_output, o_error);

    var Message = "Command: " + cmd + "\n" +
	(ExitCode == 0 ? "OK\n" + o_output.value : "Error (" + ExitCode + ") - " + o_error.value) + "\n";

    qplLog(Message, false);
    
    return;
}


function CheckJobTrackerConnection() {
    
    postJobTrackerInfo("q_task=test", true);
    
    return;
}

function postJobTrackerInfo(postInfo, Debug)
{
    // Data formatted... a=stuff&b=stuff&c=stuff...  encoded as needed... "&q_var_value=" + encodeURIComponent(Value) +
    var qplRequest = false;
    var prefManager = Components.classes["@mozilla.org/preferences-service;1"]
	.getService(Components.interfaces.nsIPrefBranch);
    var JobTrackerURLNotSet=GetLocalizedMessage('JobTrackerURLNotSet');
    var JobTrackerPassword = GetLocalizedMessage('JobTrackerPassword');
    var JobTrackerPasswordCanceled = GetLocalizedMessage('JobTrackerPasswordCanceled');
    var JobTrackerPasswordSave = GetLocalizedMessage('JobTrackerPasswordSave');
    var JobTrackerXMLHttpRequestError =  GetLocalizedMessage('JobTrackerXMLHttpRequestError');

    var JobTrackerURL = prefManager.getCharPref(MY_JOBTRACKER_URL).trim();
    if (JobTrackerURL.length == 0) {
	qplLog(JobTrackerURLNotSet, false);
	return false;
    }
    
    var Account = GetAccount(JobTrackerPassword);
    
    // result is true if OK was pressed, false if cancel was pressed. username.value,
    // password.value, and check.value are set if OK was pressed.
    
    if (Account.status) {
        postInfo += "&q_uname=" + Account.user + "&q_pswd=" + Account.password;
    } else {
	qplLog(JobTrackerPasswordCanceled, false);
	return false;
    }
    
    if (Debug) {
	qplLog("Command: " + JobTrackerURL + "/" + MY_JOBTRACKER_AJAX + "\nPost: " + postInfo, false);
    }
    
    if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari

	qplRequest=new XMLHttpRequest();

    } else if (window.ActiveXObject){// IE
	try{
	    qplRequest = new ActiveXObject("Msxml2.XMLHTTP");
	} catch (e) {
	    try{
		qplRequest = new ActiveXObject("Microsoft.XMLHTTP");
	    } catch (e) {
	    }
	}
    }
    
    if (!qplRequest){
        qplLog(JobTrackerXMLHttpRequestError, false);
        return false;
    }

    var JobTrackerUpdated = false;
    qplRequest.onreadystatechange=function()
    {
	if (Debug) {
	    qplLog("Ready state: " + qplRequest.readyState +  " Status: " + qplRequest.status, true);
	}
	
	if (qplRequest.readyState==4 && qplRequest.status==200)
	{
	    var xmldoc = qplRequest.responseXML;
	    var status = xmldoc.getElementsByTagName("status");
	    var message = xmldoc.getElementsByTagName("message");
	    
	    if (status[0].firstChild.nodeValue == 0) {
		JobTrackerUpdated = true;
	    }
	    
	    qplLog("JobTracker: " + message[0].firstChild.nodeValue + " (" + status[0].firstChild.nodeValue + ")", true);
	}
    }

    qplRequest.open("POST", JobTrackerURL + "/" + MY_JOBTRACKER_AJAX, false);
    qplRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    qplRequest.send(postInfo);
    
    return JobTrackerUpdated;
}


function GetSvnProjectList(qpl_svn_project, qpl_working_dir_path, qpl_svn_project_label, Repo) {
    var prefManager = Components.classes["@mozilla.org/preferences-service;1"]
	.getService(Components.interfaces.nsIPrefBranch);

    var runSvc = Components.classes["@activestate.com/koRunService;1"]
	.getService(Components.interfaces.koIRunService);

    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	.getService(Components.interfaces.nsIPromptService);

    var Target = Components.classes["@mozilla.org/file/local;1"]
	.createInstance(Components.interfaces.nsILocalFile);

    if (Repo == 1) {
	var SvnPath = prefManager.getCharPref(MY_SVN_PREF);
	qpl_svn_project_label.value = SvnRepo1;
    } else {
	var SvnPath = prefManager.getCharPref(MY_SVN2_PREF);
	qpl_svn_project_label.value = SvnRepo2;
    }
    
    if (prefManager.getCharPref(MY_WORKING_DIR).length) {
	qpl_working_dir_path.innerHTML = CurrentWorkingDirectory + " " + prefManager.getCharPref(MY_WORKING_DIR);
    } else {
	qpl_working_dir_path.innerHTML = WorkingFolderMissing;
    }

    var WorkingDirPath = prefManager.getCharPref(MY_WORKING_DIR);
    var SvnExecutable = GetSvnPath();
    
    var cmd = SvnExecutable + " -v list \"" + SvnPath + "\" --non-interactive";
    var cwd = "";
    var env = "";
    var input = "";
    var o_output = new Object();
    var o_error = new Object();

    var ExitCode = runSvc.RunAndCaptureOutput(cmd, cwd, env, input, o_output, o_error);

    if (ExitCode == 0) {
	var List = o_output.value.split("\n");
	for (var i = 0; i < List.length; i++) {
	    var List2 = List[i].split(/[ ]+/);

	    if (List2.length != 7 || List2[6] == "./") {
		continue;
	    }

	    var row = document.createElement('listitem');

	    //     645 dooleyk               Jul 14 06:34 ./

	    // project
	    var cell = document.createElement('listcell');
	    cell.setAttribute('label', List2[6]);

	    Target.initWithPath(WorkingDirPath);
	    Target.append(List2[6].replace(/\//, ""));
	    if (Target.exists()) {
		row.setAttribute('value', "!" + List2[6]);

	    } else {
		cell.setAttribute('style', "font-weight:bold;");
		row.setAttribute('value', List2[6]);
	    }
	    row.appendChild(cell);

	    // comitter
	    cell = document.createElement('listcell');
	    cell.setAttribute('label', List2[2]);
	    row.appendChild(cell);

	    // when
	    cell = document.createElement('listcell');
	    cell.setAttribute('label', List2[3] + " " + List2[4] + " " + List2[5]);
	    row.appendChild(cell);

	    // revision
	    var cell = document.createElement('listcell');
	    cell.setAttribute('label', List2[1]);
	    cell.setAttribute('style', "text-align: right;");
	    row.appendChild(cell);

	    qpl_svn_project.appendChild(row);
	}
    } else {
	alert(o_error.value);
    }
    return 1;

}

function CheckoutSVNproject(ko, qpl_svn_project_id, qpl_project_folder_id, Repo) {
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	.getService(Components.interfaces.nsIPromptService);

    var Target = Components.classes["@mozilla.org/file/local;1"]
	.createInstance(Ci.nsILocalFile);

    var prefManager = Components.classes["@mozilla.org/preferences-service;1"]
	.getService(Components.interfaces.nsIPrefBranch);

    var obsvc = Components.classes["@mozilla.org/observer-service;1"]
	.getService(Components.interfaces.nsIObserverService);

    Components.utils.import("resource://gre/modules/osfile.jsm");

    var qpl_svn_project = document.getElementById(qpl_svn_project_id);
    var qpl_project_folder = document.getElementById(qpl_project_folder_id).value;
    if (Repo == 1) {
	var SvnPath = prefManager.getCharPref(MY_SVN_PREF);
    } else {
	var SvnPath = prefManager.getCharPref(MY_SVN2_PREF);
    }
    var WorkingDirPath = prefManager.getCharPref(MY_WORKING_DIR);
    var SvnExecutable = GetSvnPath();
    var SvnResult = 0;
    
    if (qpl_svn_project.selectedIndex == -1) {
	prompts.alert(window, QPLWrapper, SelectSVNProject);
	return 0;
    }
    try {
	Target.initWithPath(WorkingDirPath);
    } catch (e) {
	prompts.alert(window, QPLWrapper, CreateFolder);
	return 0;
    }

    if (!Target.exists() || !Target.isDirectory()) {
	prompts.alert(window, QPLWrapper, CreateFolder);
	return 0;
    }

    if (/^!/.test(qpl_svn_project.selectedItem.value)) {
	// Do an update...
	var UpdatingProject = SB.getString('UpdatingProject');
	var Project = qpl_svn_project.selectedItem.value.substring(1);
	Project = Project.replace(/\//, "");
	Target.append(Project);
    
	qplLog(UpdatingProject, false); // clear command output window

	SvnResult = qplRun(SvnExecutable + " update \"" + Target.path + "\" --accept mine-conflict --non-interactive",
	    "",
	    "",
	    "",
	    true);
	
    } else {
	// Do a checkout...
	var CheckingOutProject = SB.getFormattedString('CheckingOutProject', [qpl_svn_project.selectedItem.value, Target.path]);
    
	qplLog(CheckingOutProject, false); // clear command output window
    
	SvnResult = qplRun(SvnExecutable + " checkout \"" + SvnPath + "/" + qpl_svn_project.selectedItem.value + "\" --non-interactive",
	    Target.path,
	    "",
	    "",
	    true);
	
	Target.append(qpl_svn_project.selectedItem.value.replace(/\//, ""));
    }

    if (SvnResult == 0) {
	// grab the lock on the .pg6 files to prevent others from editing
	SvnResult = qplRun(SvnExecutable + " lock *.pg6* --non-interactive",
	    Target.path,
	    "",
	    "",
	    true);
	
	if (SvnResult == 0) {
	    ko.commands.doCommand('cmd_saveAll');
	    // ko.commands.doCommand('cmd_closeAll'); don't want to close other .pg6 files that are locked to othe access!
	    
	    // Open any .pg6 files in checked out directory...
	    qplLog(LookingForQPLFiles, true);
	
	    // Open iterator
	    let iterator = new OS.File.DirectoryIterator(Target.path);
	    let subdirs = [];
	    // Iterate through the directory
	    let promise = iterator.forEach(function onEntry(entry) {
		if (entry.isDir) {
		    subdirs.push(entry);
		} else {
		    if (entry.name.match(/\.pg6/)) {
			qplLog(entry.path, true);
			try {
			    ko.open.URI(entry.path);
			    ko.commands.doCommand('cmd_refreshStatus');
			} catch (e) {
			    alert(e);
			}
		    }
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
    }

    SetPlace(ko, Target.path);
    
    return 1;
}


function svnProjectExists(Name, SvnPath) {
    var prefManager = Components.classes["@mozilla.org/preferences-service;1"]
	.getService(Components.interfaces.nsIPrefBranch);
    
    var runSvc = Components.classes["@activestate.com/koRunService;1"]
	.getService(Components.interfaces.koIRunService);

    var SvnExecutable = GetSvnPath();

    var cmd = SvnExecutable + " list \"" + SvnPath + "\" --non-interactive";
    var cwd = "";
    var env = "";
    var input = "";
    var o_output = new Object();
    var o_error = new Object();
    
    var ExitCode = runSvc.RunAndCaptureOutput(cmd, cwd, env, input, o_output, o_error);
    
    if (ExitCode == 0) {
	var List = o_output.value.split("/\n");
	for (var i = 0; i < List.length; i++) {
	    if (List[i].trim() == Name.trim()) {
		return true;
	    }
	}
    } else {
	qplLog(o_error.value, true);
    }

    return false;
}

function AddSvnNewFiles(CurrentWorkingDirectory) {
    var prefManager = Components.classes["@mozilla.org/preferences-service;1"]
	.getService(Components.interfaces.nsIPrefBranch);

    var runSvc = Components.classes["@activestate.com/koRunService;1"]
	.getService(Components.interfaces.koIRunService);

    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	.getService(Components.interfaces.nsIPromptService);

    var Target = Components.classes["@mozilla.org/file/local;1"]
	.createInstance(Ci.nsILocalFile);

    var SvnExecutable = GetSvnPath();

    var cmd = SvnExecutable + " status --non-interactive";
    var cwd = CurrentWorkingDirectory;
    var env = "";
    var input = "";
    var o_output = new Object();
    var o_error = new Object();
    var Summary = "Adding files to version control:\n";

    var ExitCode = runSvc.RunAndCaptureOutput(cmd, cwd, env, input, o_output, o_error);

    if (ExitCode == 0) {
	var List = o_output.value.split("\n");
	for (var i = 0; i < List.length; i++) {
	    var List2 = List[i].split(/[ ]+/);

	    if (List2.length != 2) {
		continue;
	    }

	    if (List2[0] == '?') {
		cmd = SvnExecutable + " add \"" + List2[1].trim() + "\" --non-interactive";
		ExitCode = runSvc.RunAndCaptureOutput(cmd, cwd, env, input, o_output, o_error);
		if (ExitCode == 0) {
		    Summary += o_output.value.trim() + "\n";
		} else {
		    Summary += o_error.value.trim() + "\n";
		}
	    }
	    
	}
	qplLog(Summary, true);
	
    } else {
	qplLog(o_error.value, true);
    }

}



function GetSampleList(qpl_wizard_sample_list) {
    
    var SampleListBox = document.getElementById(qpl_wizard_sample_list);
    Components.utils.import("resource://gre/modules/osfile.jsm");
    var SamplePath = chromeToPath(MY_SAMPLES);

    if (/^file:\/+[A-Z]:\//.test(SamplePath) ) {	// windows
	SamplePath = SamplePath.replace(/^file:\/+/, "");
    } else {
	SamplePath = SamplePath.replace(/^file:\/\//, "");
	SamplePath = SamplePath.replace(/\%20/g, " " );
    }
    // qplLog("Looking for sample files at " + SamplePath, true);


    // Open iterator
    let iterator = new OS.File.DirectoryIterator(SamplePath);
    let SampleList = [];
    // Iterate through the directory
    let promise = iterator.forEach(function onEntry(entry) {
	if (!entry.isDir) {
		SampleList.push( { name: entry.name,  path: entry.path } );
	}
    });
    // Finally, close the iterator, sort the result, and stick it in the listbox
    promise.then(function onSuccess() {
	iterator.close();
	
	SampleList.sort(function (a, b) {
	    if (a.name.toLowerCase() > b.name.toLowerCase()) {
		return 1;
	    }
	    if (a.name.toLowerCase() < b.name.toLowerCase()) {
		return -1;
	    }
	    // a must be equal to b
	    return 0;
	});
    
	
	for (var i = 0; i < SampleList.length; i++) {
	    var row = document.createElement('listitem');
    
	    var cell = document.createElement('listcell');
	    
	    cell.setAttribute('label', SampleList[i].name.replace(/\.txt$/, "") );
	    row.setAttribute('value', SampleList[i].name);
    
	    row.appendChild(cell);
	    SampleListBox.appendChild(row);
	}
	SampleListBox.selectedIndex = 0;
	
    }, function onFailure(reason) {
	iterator.close();
	throw reason;
    });
    
    return 1;

}
