import zipfile
import xml.etree.ElementTree as ET

def read_xlsx(path):
    with zipfile.ZipFile(path, 'r') as z:
        try:
            shared_strings_xml = z.read('xl/sharedStrings.xml')
            ss_tree = ET.fromstring(shared_strings_xml)
            namespace = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
            shared_strings = ["".join(t.text for t in si.findall(f'.//{namespace}t') if t.text) for si in ss_tree.findall(f'{namespace}si')]
        except Exception as e:
            shared_strings = []

        sheet_xml = z.read('xl/worksheets/sheet1.xml')
        s_tree = ET.fromstring(sheet_xml)
        namespace = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
        
        rows = s_tree.findall(f'.//{namespace}row')
        for r in rows:
            row_data = []
            for c in r.findall(f'.//{namespace}c'):
                v = c.find(f'{namespace}v')
                if v is not None:
                    val = v.text
                    if c.get('t') == 's':
                        val = shared_strings[int(val)]
                    row_data.append(val)
                else:
                    is_t = c.find(f'{namespace}is/{namespace}t')
                    if is_t is not None:
                        row_data.append(is_t.text)
                    else:
                        row_data.append('')
            if any(row_data):
                print('\t'.join(str(d) for d in row_data))

import sys
try:
    read_xlsx(sys.argv[1])
except Exception as e:
    print(e)
