"""Compatibility for legacy GenBank ranges beginning at zero."""

import re
from io import StringIO


def normalize_zero_start_locations(text):
    """Treat 0..N as 1..N on input; Biopython then stores [0, N).

    Only feature location text is changed. Sequence, qualifiers, valid
    positive coordinates and genuinely negative coordinates are untouched.
    """
    lines = text.splitlines(keepends=True)
    in_features = False
    in_location = False
    for index, line in enumerate(lines):
        if line.startswith('FEATURES'):
            in_features = True
            in_location = False
            continue
        if line and not line[0].isspace():
            in_features = False
            in_location = False
        if not in_features:
            continue
        if line[5:21].strip():
            in_location = True
        elif line[21:].lstrip().startswith('/'):
            in_location = False
        if in_location:
            location = re.sub(r'(^|[\s(,])0(?=\.\.[1-9]\d*)', r'\g<1>1', line[21:])
            lines[index] = line[:21] + location
    return ''.join(lines)


def compatible_genbank_stream(stream):
    return StringIO(normalize_zero_start_locations(stream.read()))
