#!/usr/bin/env python

"""QPL support for codeintel.

This file will be imported by the codeintel system on startup and the
register() function called to register this language with the system. All
Code Intelligence for this language is controlled through this module.
"""

import os
import sys
import logging

from codeintel2.common import *
from codeintel2.citadel import CitadelBuffer
from codeintel2.langintel import LangIntel
from codeintel2.udl import UDLBuffer, UDLCILEDriver, UDLLexer
from codeintel2.util import CompareNPunctLast

from SilverCity.ScintillaConstants import (
    SCE_UDL_SSL_DEFAULT, SCE_UDL_SSL_IDENTIFIER,
    SCE_UDL_SSL_OPERATOR, SCE_UDL_SSL_VARIABLE, SCE_UDL_SSL_WORD,
)

try:
    from xpcom.server import UnwrapObject
    _xpcom_ = True
except ImportError:
    _xpcom_ = False



#---- globals

lang = "QPL"
log = logging.getLogger("codeintel.qpl")
#log.setLevel(logging.DEBUG)


# These keywords are copied from "QPL-mainlex.udl" - be sure to keep both
# of them in sync.
keywords = [
    # Keywords
        "ACCOUNT",
        "ALIGN",
        "AN",
        "ANSWER",
        "ANUMBERING",
        "ARCHIVEDATE",
        "AUTHENTICATION",
        "AUTHOR",
        "BACKGROUND",
        "BOLD",
        "BY",
        "CARD",
        "CASES",
        "CLASS",
        "CLOSEBUTTON",
        "COLORSCHEME",
        "COLUMNS",
        "COLUMNSHEADINGS",
        "COLUMNSROWSHADING",
        "COMPUTE",
        "COMPUTEIF",
        "CONTACT",
        "DIRECTION",
        "DISPLAY",
        "DISPLAYFADE",
        "EMAIL",
        "ENGINE",
        "ESTIMATE",
        "EXPIRE",
        "EXPIREDATE",
        "FONT",
        "FORMAT",
        "FROM",
        "FROMNAME",
        "GOTO",
        "GROUP",
        "HEIGHT",
        "HELLO",
        "HELP",
        "HFONT",
        "HIDE",
        "HIGH",
        "HOVER",
        "HTMLSPECIALCHARS",
        "INCLUDE",
        "IF",
        "INDENT",
        "INSTRUCTION",
        "ISSUEDATE",
        "JOBCODE",
        "LABEL",
        "LANGUAGE",
        "LIVEUPDATE",
        "LOCK",
        "LOGINEMAIL",
        "LOGINJUMP",
        "LOGINPASSWORD",
        "LOGINURL",
        "LOGO",
        "LOW",
        "MATRIX",
        "MATRIXDKSHADING",
        "MATRIXROWSHADING",
        "MATRIXWIDTH",
        "MENU",
        "NAME",
        "NAVIGATION",
        "NEWCARD",
        "NEWPAGE",
        "NE",
        "NEXT",
        "OPENENDCOLS",
        "OPENENDMAXCHARS",
        "OPENENDROWS",
        "PAGE",
        "PAGEGUTTER",
        "PAGEWIDTH",
        "PASSWORD",
        "PERCENT",
        "PHONE",
        "POPUP",
        "PRINTBUTTON",
        "PRODUCT",
        "PRODUCTNUMBER",
        "PRODUCTTITLE",
        "PROGRESS",
        "QNUMBERING",
        "QPREFIX",
        "QU",
        "QUERY",
        "QUESTION",
        "QUESTIONNAIREDB",
        "QUESTIONNAIRESTATUS",
        "QUESTIONNAIREURL",
        "RANK",
        "REPLYTO",
        "REPORTNUMBER",
        "REPORTTITLE",
        "REQUIRED",
        "RETURNPATH",
        "SCRIPT",
        "SELECTCASEALT",
        "SELECTCASEBY",
        "SELECTCASEFORMAT",
        "SELECTCASELABEL",
        "SELECTCASEREQUIRED",
        "SET",
        "SKIP",
        "SKIPIF",
        "STATUS",
        "STRINGCOLS",
        "STYLE",
        "SUBTITLE",
        "SUM",
        "SUMMARY",
        "SYSTEM",
        "TITLE",
        "TYPE",
        "UPLOADMAX",
        "UPLOADOVERWRITE",
        "USER",
        "VALIGN",
        "VERBOSE",
        "WEIGHT",
        "WIDTH",
        "YUI",
        "account",
        "align",
        "an",
        "answer",
        "anumbering",
        "archivedate",
        "authentication",
        "author",
        "background",
        "bold",
        "by",
        "card",
        "cases",
        "class",
        "closebutton",
        "colorscheme",
        "columns",
        "columnsheadings",
        "columnsrowshading",
        "compute",
        "computeif",
        "contact",
        "direction",
        "display",
        "displayfade",
        "email",
        "engine",
        "estimate",
        "expire",
        "expiredate",
        "font",
        "format",
        "from",
        "fromname",
        "goto",
        "group",
        "height",
        "hello",
        "help",
        "hfont",
        "hide",
        "high",
        "hover",
        "htmlspecialchars",
        "include",
        "if",
        "indent",
        "instruction",
        "issuedate",
        "jobcode",
        "label",
        "language",
        "liveupdate",
        "lock",
        "loginemail",
        "loginjump",
        "loginpassword",
        "loginurl",
        "logo",
        "low",
        "matrix",
        "matrixdkshading",
        "matrixrowshading",
        "matrixwidth",
        "menu",
        "name",
        "navigation",
        "newcard",
        "newpage",
        "ne",
        "next",
        "openendcols",
        "openendmaxchars",
        "openendrows",
        "page",
        "pagegutter",
        "pagewidth",
        "password",
        "percent",
        "phone",
        "popup",
        "printbutton",
        "product",
        "productnumber",
        "producttitle",
        "progress",
        "qnumbering",
        "qprefix",
        "qu",
        "query",
        "question",
        "questionnairedb",
        "questionnairestatus",
        "questionnaireurl",
        "rank",
        "replyto",
        "reportnumber",
        "reporttitle",
        "required",
        "returnpath",
        "script",
        "selectcasealt",
        "selectcaseby",
        "selectcaseformat",
        "selectcaselabel",
        "selectcaserequired",
        "set",
        "skip",
        "skipif",
        "status",
        "stringcols",
        "style",
        "subtitle",
        "sum",
        "summary",
        "system",
        "title",
        "type",
        "uploadmax",
        "uploadoverwrite",
        "user",
        "valign",
        "verbose",
        "weight",
        "width",
        "yui",
        "CHECK",
        "DATE",
        "LDATE",
        "MULT",
        "NLIST",
        "NUMBER",
        "OPENEND",
        "QUESTIONNAIRE",
        "RANDOM",
        "SDATE",
        "SLIST",
        "STRING",
        "TIME",
        "UPLOAD",
        "VERSION",
        "VOID",
        "XDATE",
        "check",
        "date",
        "ldate",
        "mult",
        "nlist",
        "number",
        "openend",
        "questionnaire",
        "random",
        "sdate",
        "slist",
        "string",
        "time",
        "upload",
        "version",
        "void",
        "xdate",
        #"A",
        "ADMIN",
        "ALICEBLUE",
        "ANONYMOUS",
        "ANTIQUEWHITE",
        "APPENDIX",
        "AQUA",
        "AQUAMARINE",
        "AZURE",
        "BASELINE",
        "BEIGE",
        "BISQUE",
        "BLACK",
        "BLANCHEDALMOND",
        "BLANK",
        "BLUE",
        "BLUEVIOLET",
        "BODY",
        "BOTTOM",
        "BREAK",
        "BROWN",
        "BUG",
        "BURLYWOOD",
        "CADETBLUE",
        "CENTER",
        "CHARTREUSE",
        "CHOCOLATE",
        "CLEAR",
        "CLOSED",
        "CORAL",
        "CORNFLOWERBLUE",
        "CORNSILK",
        "COUNT",
        "CREATE",
        "CRIMSON",
        "CYAN",
        "DARKBLUE",
        "DARKCYAN",
        "DARKGOLDENROD",
        "DARKGRAY",
        "DARKGREEN",
        "DARKGREY",
        "DARKKHAKI",
        "DARKMAGENTA",
        "DARKOLIVEGREEN",
        "DARKORANGE",
        "DARKORCHID",
        "DARKRED",
        "DARKSALMON",
        "DARKSEAGREEN",
        "DARKSLATEBLUE",
        "DARKSLATEGRAY",
        "DARKSLATEGREY",
        "DARKTURQUOISE",
        "DARKVIOLET",
        "DATAADMIN",
        "DEEPPINK",
        "DEEPSKYBLUE",
        "DIMGRAY",
        "DIMGREY",
        "DODGERBLUE",
        "EOL",
        "EOQ",
        "ESUPPLEMENT",
        "EXIST",
        "FALSE",
        "FAST",
        "FIREBRICK",
        "FLORALWHITE",
        "FORESTGREEN",
        "FORM",
        "FUCHSIA",
        "GAINSBORO",
        "GHOSTWHITE",
        "GOLD",
        "GOLDENROD",
        "GRAY",
        "GREEN",
        "GREENYELLOW",
        "GREY",
        "HARD",
        "HONEYDEW",
        "HOTPINK",
        "HOVER",
        "HOVERMAIN",
        "HOVERMENU",
        "HOVERMENUNAVBB",
        "HR",
        "IN",
        "INDIANRED",
        "INDIGO",
        "INSUBSECTION",
        "IVORY",
        "KHAKI",
        #"L",
        "LARGE",
        "LARGER",
        "LAVENDER",
        "LAVENDERBLUSH",
        "LAWNGREEN",
        "LDAP",
        "LEFT",
        "LEMONCHIFFON",
        "LIGHTBLUE",
        "LIGHTCORAL",
        "LIGHTCYAN",
        "LIGHTGOLDENRODYELLOW",
        "LIGHTGRAY",
        "LIGHTGREEN",
        "LIGHTGREY",
        "LIGHTPINK",
        "LIGHTSALMON",
        "LIGHTSEAGREEN",
        "LIGHTSKYBLUE",
        "LIGHTSLATEGRAY",
        "LIGHTSLATEGREY",
        "LIGHTSTEELBLUE",
        "LIGHTYELLOW",
        "LIME",
        "LIMEGREEN",
        "LINEN",
        "LONG",
        "LRGR",
        #"M",
        "MAGENTA",
        "MAJOROFF",
        "MAJORON",
        "MANAGER",
        "MANY",
        "MAROON",
        "MEDIUM",
        "MEDIUMAQUAMARINE",
        "MEDIUMBLUE",
        "MEDIUMORCHID",
        "MEDIUMPURPLE",
        "MEDIUMSEAGREEN",
        "MEDIUMSLATEBLUE",
        "MEDIUMSPRINGGREEN",
        "MEDIUMTURQUOISE",
        "MEDIUMVIOLETRED",
        "MENUROW",
        "MENUROWON",
        "MIDDLE",
        "MIDNIGHTBLUE",
        "MINTCREAM",
        "MISTYROSE",
        "MOCCASIN",
        "MOF",
        "MON",
        "MONOSPACE",
        "NAVAJOWHITE",
        "NAVBB",
        "NAVY",
        "NEW",
        "NONE",
        "NONPERCENT",
        "NORMAL",
        "OFF",
        "OLDLACE",
        "OLIVE",
        "OLIVEDRAB",
        "ON",
        "ONE",
        "OPTION",
        "ORANGE",
        "ORANGERED",
        "ORCHID",
        "OUT",
        "OUTSUBSECTION",
        "PALEGOLDENROD",
        "PALEGREEN",
        "PALETURQUOISE",
        "PALEVIOLETRED",
        "PAPAYAWHIP",
        "PEACHPUFF",
        "PERU",
        "PINK",
        "PLUM",
        "POPUPBANNER",
        "POWDERBLUE",
        "PREVIOUS",
        "PURPLE",
        "RECORD",
        "RED",
        "RIGHT",
        "ROSYBROWN",
        "ROW",
        "ROW1",
        "ROW2",
        "ROWDK",
        "ROWHEADER",
        "ROYALBLUE",
        "RSA",
        #"S",
        "SADDLEBROWN",
        "SALMON",
        "SANDYBROWN",
        "SANSSERIF",
        "SAS",
        "SEAGREEN",
        "SEASHELL",
        "SERIF",
        "SHORT",
        "SIENNA",
        "SILVER",
        "SKYBLUE",
        "SLATEBLUE",
        "SLATEGRAY",
        "SLATEGREY",
        "SLOW",
        "SMALL",
        "SMALLER",
        "SMLR",
        "SNOW",
        "SOFT",
        "SOL",
        "SOQ",
        "SPRINGGREEN",
        "STEELBLUE",
        "SUDAAN",
        "SUPERUSER",
        "TAN",
        "TEAL",
        "THISTLE",
        "TOMATO",
        "TOP",
        "TRUE",
        "TURQUOISE",
        "VERYFAST",
        "VERYSLOW",
        "VIOLET",
        "WHEAT",
        "WHITE",
        "WHITESMOKE",
        "XL",
        "XLARGE",
        "XXL",
        "XXLARGE",
        "XXS",
        "XXSMALL",
        "XS",
        "XSMALL",
        "YELLOW",
        "YELLOWGREEN",
        #"a",
        "admin",
        "aliceblue",
        "anonymous",
        "antiquewhite",
        "appendix",
        "aqua",
        "aquamarine",
        "azure",
        "baseline",
        "beige",
        "bisque",
        "black",
        "blanchedalmond",
        "blank",
        "blue",
        "blueviolet",
        "body",
        "bottom",
        "break",
        "brown",
        "bug",
        "burlywood",
        "cadetblue",
        "center",
        "chartreuse",
        "chocolate",
        "clear",
        "closed",
        "coral",
        "cornflowerblue",
        "cornsilk",
        "count",
        "create",
        "crimson",
        "cyan",
        "darkblue",
        "darkcyan",
        "darkgoldenrod",
        "darkgray",
        "darkgreen",
        "darkgrey",
        "darkkhaki",
        "darkmagenta",
        "darkolivegreen",
        "darkorange",
        "darkorchid",
        "darkred",
        "darksalmon",
        "darkseagreen",
        "darkslateblue",
        "darkslategray",
        "darkslategrey",
        "darkturquoise",
        "darkviolet",
        "dataadmin",
        "deeppink",
        "deepskyblue",
        "dimgray",
        "dimgrey",
        "dodgerblue",
        "eol",
        "eoq",
        "esupplement",
        "exist",
        "false",
        "fast",
        "firebrick",
        "floralwhite",
        "forestgreen",
        "form",
        "fuchsia",
        "gainsboro",
        "ghostwhite",
        "gold",
        "goldenrod",
        "gray",
        "green",
        "greenyellow",
        "grey",
        "hard",
        "honeydew",
        "hotpink",
        "hover",
        "hovermain",
        "hovermenu",
        "hovermenunavbb",
        "hr",
        "in",
        "indianred",
        "indigo",
        "insubsection",
        "ivory",
        "khaki",
        #"l",
        "large",
        "larger",
        "lavender",
        "lavenderblush",
        "lawngreen",
        "ldap",
        "left",
        "lemonchiffon",
        "lightblue",
        "lightcoral",
        "lightcyan",
        "lightgoldenrodyellow",
        "lightgray",
        "lightgreen",
        "lightgrey",
        "lightpink",
        "lightsalmon",
        "lightseagreen",
        "lightskyblue",
        "lightslategray",
        "lightslategrey",
        "lightsteelblue",
        "lightyellow",
        "lime",
        "limegreen",
        "linen",
        "long",
        "lrgr",
        "m",
        "magenta",
        "majoroff",
        "majoron",
        "manager",
        "many",
        "maroon",
        "medium",
        "mediumaquamarine",
        "mediumblue",
        "mediumorchid",
        "mediumpurple",
        "mediumseagreen",
        "mediumslateblue",
        "mediumspringgreen",
        "mediumturquoise",
        "mediumvioletred",
        "menurow",
        "menurowon",
        "middle",
        "midnightblue",
        "mintcream",
        "mistyrose",
        "moccasin",
        "mof",
        "mon",
        "monospace",
        "navajowhite",
        "navbb",
        "navy",
        "new",
        "none",
        "nonpercent",
        "normal",
        "off",
        "oldlace",
        "olive",
        "olivedrab",
        "on",
        "one",
        "option",
        "orange",
        "orangered",
        "orchid",
        "out",
        "outsubsection",
        "palegoldenrod",
        "palegreen",
        "paleturquoise",
        "palevioletred",
        "papayawhip",
        "peachpuff",
        "peru",
        "pink",
        "plum",
        "popupbanner",
        "powderblue",
        "previous",
        "purple",
        "record",
        "red",
        "right",
        "rosybrown",
        "row",
        "row1",
        "row2",
        "rowdk",
        "rowheader",
        "royalblue",
        "rsa",
        #"s",
        "saddlebrown",
        "salmon",
        "sandybrown",
        "sansserif",
        "sas",
        "seagreen",
        "seashell",
        "serif",
        "short",
        "sienna",
        "silver",
        "skyblue",
        "slateblue",
        "slategray",
        "slategrey",
        "slow",
        "small",
        "smaller",
        "smlr",
        "snow",
        "soft",
        "sol",
        "soq",
        "springgreen",
        "steelblue",
        "sudaan",
        "superuser",
        "tan",
        "teal",
        "thistle",
        "tomato",
        "top",
        "true",
        "turquoise",
        "veryfast",
        "veryslow",
        "violet",
        "wheat",
        "white",
        "whitesmoke",
        "xl",
        "xlarge",
        "xxl",
        "xxlarge",
        "xxs",
        "xxsmall",
        "xs",
        "xsmall",
        "yellow",
        "yellowgreen"
]

#---- Lexer class

# Dev Notes:
# Komodo's editing component is based on scintilla (scintilla.org). This
# project provides C++-based lexers for a number of languages -- these
# lexers are used for syntax coloring and folding in Komodo. Komodo also
# has a UDL system for writing UDL-based lexers that is simpler than
# writing C++-based lexers and has support for multi-language files.
#
# The codeintel system has a Lexer class that is a wrapper around these
# lexers. You must define a Lexer class for lang QPL. If Komodo's
# scintilla lexer for QPL is UDL-based, then this is simply:
#
#   from codeintel2.udl import UDLLexer
#   class QPLLexer(UDLLexer):
#       lang = lang
#
# Otherwise (the lexer for QPL is one of Komodo's existing C++ lexers
# then this is something like the following. See lang_python.py or
# lang_perl.py in your Komodo installation for an example. "SilverCity"
# is the name of a package that provides Python module APIs for Scintilla
# lexers.
#
#   import SilverCity
#   from SilverCity.Lexer import Lexer
#   from SilverCity import ScintillaConstants
#   class QPLLexer(Lexer):
#       lang = lang
#       def __init__(self):
#           self._properties = SilverCity.PropertySet()
#           self._lexer = SilverCity.find_lexer_module_by_id(ScintillaConstants.SCLEX_QPL)
#           self._keyword_lists = [
#               # Dev Notes: What goes here depends on the C++ lexer
#               # implementation.
#           ]


from codeintel2.udl import UDLLexer
class QPLLexer(UDLLexer):
        lang = lang


#---- LangIntel class

# Dev Notes:
# All language should define a LangIntel class. (In some rare cases it
# isn't needed but there is little reason not to have the empty subclass.)
#
# One instance of the LangIntel class will be created for each codeintel
# language. Code browser functionality and some buffer functionality
# often defers to the LangIntel singleton.
#
# This is especially important for multi-lang files. For example, an
# HTML buffer uses the JavaScriptLangIntel and the CSSLangIntel for
# handling codeintel functionality in <script> and <style> tags.
#
# See other lang_*.py and codeintel_*.py files in your Komodo installation for
# examples of usage.
class QPLLangIntel(LangIntel):
    lang = lang

    ##
    # Implicit codeintel triggering event, i.e. when typing in the editor.
    #
    # @param buf {components.interfaces.koICodeIntelBuffer}
    # @param pos {int} The cursor position in the editor/text.
    # @param implicit {bool} Automatically called, else manually called?
    #
    def trg_from_pos(self, buf, pos, implicit=True, DEBUG=False, ac=None):
        #DEBUG = True
        if pos < 1:
            return None

        # accessor {codeintel2.accessor.Accessor} - Examine text and styling.
        accessor = buf.accessor
        last_pos = pos-1
        char = accessor.char_at_pos(last_pos)
        style = accessor.style_at_pos(last_pos)
        if DEBUG:
            print "trg_from_pos: char: %r, style: %d" % (char, accessor.style_at_pos(last_pos), )
        if style in (SCE_UDL_SSL_WORD, SCE_UDL_SSL_IDENTIFIER):
            # Functions/builtins completion trigger.
            start, end = accessor.contiguous_style_range_from_pos(last_pos)
            if DEBUG:
                print "identifier style, start: %d, end: %d" % (start, end)
            # Trigger when two characters have been typed.
            if (last_pos - start) == 1:
                if DEBUG:
                    print "triggered:: complete identifiers"
                return Trigger(self.lang, TRG_FORM_CPLN, "identifiers",
                               start, implicit,
                               word_start=start, word_end=end)
        return None

    ##
    # Explicit triggering event, i.e. Ctrl+J.
    #
    # @param buf {components.interfaces.koICodeIntelBuffer}
    # @param pos {int} The cursor position in the editor/text.
    # @param implicit {bool} Automatically called, else manually called?
    #
    def preceding_trg_from_pos(self, buf, pos, curr_pos,
                               preceding_trg_terminators=None, DEBUG=False):
        #DEBUG = True
        if pos < 1:
            return None

        # accessor {codeintel2.accessor.Accessor} - Examine text and styling.
        accessor = buf.accessor
        last_pos = pos-1
        char = accessor.char_at_pos(last_pos)
        style = accessor.style_at_pos(last_pos)
        if DEBUG:
            print "pos: %d, curr_pos: %d" % (pos, curr_pos)
            print "char: %r, style: %d" % (char, style)
        if style in (SCE_UDL_SSL_WORD, SCE_UDL_SSL_IDENTIFIER):
            # Functions/builtins completion trigger.
            start, end = accessor.contiguous_style_range_from_pos(last_pos)
            if DEBUG:
                print "triggered:: complete identifiers"
            return Trigger(self.lang, TRG_FORM_CPLN, "identifiers",
                           start, implicit=False,
                           word_start=start, word_end=end)
        return None

    ##
    # Provide the list of completions or the calltip string.
    # Completions are a list of tuple (type, name) items.
    #
    # Note: This example is *not* asynchronous.
    def async_eval_at_trg(self, buf, trg, ctlr):
        if _xpcom_:
            trg = UnwrapObject(trg)
            ctlr = UnwrapObject(ctlr)
        pos = trg.pos
        ctlr.start(buf, trg)

        if trg.id == (self.lang, TRG_FORM_CPLN, "identifiers"):
            word_start = trg.extra.get("word_start")
            word_end = trg.extra.get("word_end")
            if word_start is not None and word_end is not None:
                # Only return keywords that start with the given 2-char prefix.
                prefix = buf.accessor.text_range(word_start, word_end)[:2]
                cplns = [x for x in keywords if x.startswith(prefix)]
                cplns = [("keyword", x) for x in sorted(cplns, cmp=CompareNPunctLast)]
                ctlr.set_cplns(cplns)
                ctlr.done("success")
                return

        ctlr.error("Unknown trigger type: %r" % (trg, ))
        ctlr.done("error")


#---- Buffer class

# Dev Notes:
# Every language must define a Buffer class. An instance of this class
# is created for every file of this language opened in Komodo. Most of
# that APIs for scanning, looking for autocomplete/calltip trigger points
# and determining the appropriate completions and calltips are called on
# this class.
#
# Currently a full explanation of these API is beyond the scope of this
# stub. Resources for more info are:
# - the base class definitions (Buffer, CitadelBuffer, UDLBuffer) for
#   descriptions of the APIs
# - lang_*.py files in your Komodo installation as examples
# - the upcoming "Anatomy of a Komodo Extension" tutorial
# - the Komodo community forums:
#   http://community.activestate.com/products/Komodo
# - the Komodo discussion lists:
#   http://listserv.activestate.com/mailman/listinfo/komodo-discuss
#   http://listserv.activestate.com/mailman/listinfo/komodo-beta
#
class QPLBuffer(UDLBuffer):
    # Dev Note: What to sub-class from?
    # - If this is a UDL-based language: codeintel2.udl.UDLBuffer
    # - Else if this is a programming language (it has functions,
    #   variables, classes, etc.): codeintel2.citadel.CitadelBuffer
    # - Otherwise: codeintel2.buffer.Buffer
    lang = lang

    # Uncomment and assign the appropriate languages - these are used to
    # determine which language controls the completions for a given UDL family.
    #m_lang = "HTML"
    #m_lang = "XML"
    #css_lang = "CSS"
    #csl_lang = "JavaScript"
    ssl_lang = "QPL"
    #tpl_lang = "QPL"

    cb_show_if_empty = True

    # Close the completion dialog when encountering any of these chars.
    cpln_stop_chars = " ()*-=+<>{}[]^&|;:'\",.?~`!@#%\\/"


#---- CILE Driver class

# Dev Notes:
# A CILE (Code Intelligence Language Engine) is the code that scans
# QPL content and returns a description of the code in that file.
# See "cile_qpl.py" for more details.
#
# The CILE Driver is a class that calls this CILE. If QPL is
# multi-lang (i.e. can contain sections of different language content,
# e.g. HTML can contain markup, JavaScript and CSS), then you will need
# to also implement "scan_multilang()".
class QPLCILEDriver(UDLCILEDriver):
    lang = lang

    def scan_purelang(self, buf):
#        import cile_qpl
#        return cile_qpl.scan_buf(buf)
        return scan_buf(buf)




#---- registration

def register(mgr):
    """Register language support with the Manager."""
    mgr.set_lang_info(
        lang,
        silvercity_lexer=QPLLexer(),
        buf_class=QPLBuffer,
        langintel_class=QPLLangIntel,
        import_handler_class=None,
        cile_driver_class=QPLCILEDriver,
        # Dev Note: set to false if this language does not support
        # autocomplete/calltips.
        is_cpln_lang=True)


#---- formerly in separate file cile_qpl.py
"""A Code Intelligence Language Engine for the QPL language. 

A "Language Engine" is responsible for scanning content of
its language and generating CIX output that represents an outline of
the code elements in that content. See the CIX (Code Intelligence XML)
format:
    http://community.activestate.com/faq/codeintel-cix-schema
    
Module Usage:
    from cile_qpl import scan
    mtime = os.stat("bar.qpl")[stat.ST_MTIME]
    content = open("bar.qpl", "r").read()
    scan(content, "bar.qpl", mtime=mtime)
"""

__version__ = "1.0.0"

import os
import sys
import time
import optparse
import logging
import pprint
import glob

# Note: c*i*ElementTree is the codeintel system's slightly modified
# cElementTree. Use it exactly as you would the normal cElementTree API:
#   http://effbot.org/zone/element-index.htm
import ciElementTree as ET

from codeintel2.common import CILEError



#---- exceptions

class QPLCILEError(CILEError):
    pass



#---- global data

log = logging.getLogger("cile.qpl")
#log.setLevel(logging.DEBUG)



#---- public module interface

def scan_buf(buf, mtime=None, lang="QPL"):
    """Scan the given QPLBuffer return an ElementTree (conforming
    to the CIX schema) giving a summary of its code elements.
    
    @param buf {QPLBuffer} is the QPL buffer to scan
    @param mtime {int} is a modified time for the file (in seconds since
        the "epoch"). If it is not specified the _current_ time is used.
        Note that the default is not to stat() the file and use that
        because the given content might not reflect the saved file state.
    """
    # Dev Notes:
    # - This stub implementation of the QPL CILE return an "empty"
    #   summary for the given content, i.e. CIX content that says "there
    #   are no code elements in this QPL content".
    # - Use the following command (in the extension source dir) to
    #   debug/test your scanner:
    #       codeintel scan -p -l QPL <example-QPL-file>
    #   "codeintel" is a script available in the Komodo SDK.
    log.info("scan '%s'", buf.path)
    if mtime is None:
        mtime = int(time.time())

    # The 'path' attribute must use normalized dir separators.
    if sys.platform.startswith("win"):
        path = buf.path.replace('\\', '/')
    else:
        path = buf.path
        
    tree = ET.Element("codeintel", version="2.0",
                      xmlns="urn:activestate:cix:2.0")
    file = ET.SubElement(tree, "file", lang=lang, mtime=str(mtime))
    blob = ET.SubElement(file, "scope", ilk="blob", lang=lang,
                         name=os.path.basename(path))

    # Dev Note:
    # This is where you process the QPL content and add CIX elements
    # to 'blob' as per the CIX schema (cix-2.0.rng). Use the
    # "buf.accessor" API (see class Accessor in codeintel2.accessor) to
    # analyze. For example:
    # - A token stream of the content is available via:
    #       buf.accessor.gen_tokens()
    #   Use the "codeintel html -b <example-QPL-file>" command as
    #   a debugging tool.
    # - "buf.accessor.text" is the whole content of the file. If you have
    #   a separate tokenizer/scanner tool for QPL content, you may
    #   want to use it.

    return tree


