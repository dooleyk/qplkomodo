# langinfo_qpl.py <--< made from https://github.com/Komodo/komodo-go/blob/master/pylib/langinfo_go.py
"""LangInfo definition for "QPL" language."""

from langinfo import LangInfo

lang = "QPL"
import styles
if not styles.StateMap.has_key(lang):
    map = styles.StateMap['C++'].copy()
    styles.addSharedStyles(map)
    styles.StateMap[lang] = map


class QPLLangInfo(LangInfo):
    """http://respondemeum.com"""
    name = lang
    conforms_to_bases = ["Text"]
    exts = [".pg6"]
    # From http://golang.org/ref/spec#Keywords
    reserved_keywords = set("""
        question type answer next
    """.split())
    # From http://golang.org/ref/spec#Predeclared_identifiers 
    predeclared_identifiers = set("""
        bool byte complex64 complex128 error float32 float64
        int int8 int16 int32 int64 rune string
        uint uint8 uint16 uint32 uint64 uintptr

        true false iota nil""".split())
    predeclared_functions = set("""
        append cap close complex copy delete imag len
        make new panic print println real recover
        """.split())
    default_encoding = "utf-8"
