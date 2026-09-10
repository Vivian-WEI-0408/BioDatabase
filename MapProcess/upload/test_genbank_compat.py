import unittest
import warnings
from io import StringIO

from Bio import SeqIO

from upload.genbank_compat import compatible_genbank_stream, normalize_zero_start_locations


class GenBankCompatibilityTests(unittest.TestCase):
    def test_zero_start_parses_without_losing_feature(self):
        text = ('LOCUS       test                      10 bp    DNA     linear   UNK 01-JAN-1980\n'
                'FEATURES             Location/Qualifiers\n'
                '     misc_feature    0..7\n'
                '                     /label="keep me"\n'
                'ORIGIN\n'
                '        1 acgtacgtac\n//\n')
        with warnings.catch_warnings(record=True) as caught:
            record = SeqIO.read(compatible_genbank_stream(StringIO(text)), 'genbank')
        self.assertFalse(any('negative starting position' in str(w.message) for w in caught))
        self.assertEqual(str(record.seq), 'ACGTACGTAC')
        self.assertEqual(int(record.features[0].location.start), 0)
        self.assertEqual(int(record.features[0].location.end), 7)
        self.assertEqual(record.features[0].qualifiers['label'], ['keep me'])

    def test_only_zero_range_starts_are_changed(self):
        text = ('FEATURES             Location/Qualifiers\n'
                '     misc_feature    complement(join(0..7,\n'
                '                     9..10))\n'
                '                     /note="0..7\n'
                '                     0..8"\n'
                '     misc_feature    -1..7\n'
                '     misc_feature    10..17\n'
                'ORIGIN\n//\n')
        expected = text.replace('join(0..7,', 'join(1..7,')
        self.assertEqual(normalize_zero_start_locations(text), expected)


if __name__ == '__main__':
    unittest.main()
