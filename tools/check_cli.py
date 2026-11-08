"""Exercise the real stdin REPL and reopen its portable database file."""
import pathlib
import subprocess
import sys
import tempfile

program = str(pathlib.Path(sys.argv[1]).resolve())
with tempfile.TemporaryDirectory() as directory:
    database = str(pathlib.Path(directory) / 'people.db')
    def run(*args, input=None, code=0):
        result = subprocess.run([program, database, *args], input=input, text=True, capture_output=True, check=False)
        assert result.returncode == code, result.stderr + result.stdout
        return result.stdout
    output = run(input="INSERT INTO people VALUES (1, 'Chloé', 90);\nSELECT * FROM people;\n.quit\n")
    assert '1 | Chloé | 90' in output
    assert '1 | Chloé | 90' in run('--execute', 'SELECT * FROM people;')
    run('--execute', 'UPDATE people SET score=95 WHERE id=1;')
    assert '95' in run('--execute', 'SELECT * FROM people;')
    run('--execute', "INSERT INTO people VALUES (1, 'dup', 0);", code=2)
    run('--execute', "INSERT INTO people VALUES (4294967296, 'bad', 0);", code=2)
    # Fill to the boundary in a single stdin session, then reject the 129th row.
    run(input=''.join(f"INSERT INTO people VALUES ({i}, 'row', 0);\n" for i in range(2, 129)) + '.quit\n')
    assert run('--execute', 'SELECT COUNT(*) FROM people;') == '128\n'
    run('--execute', "INSERT INTO people VALUES (129, 'full', 0);", code=2)
    before = pathlib.Path(database).read_bytes()
    assert len(before) == 8 + 128 * 40
    pathlib.Path(database + '.tmp').write_bytes(b'keep')
    run('--execute', 'DELETE FROM people WHERE id=1;', code=3)
    assert pathlib.Path(database).read_bytes() == before
    pathlib.Path(database).write_bytes(before[:-1])
    run('--execute', 'SELECT * FROM people;', code=3)
    assert pathlib.Path(database).read_bytes() == before[:-1]
print('PASS native TinyDB REPL, reopen, CRUD, UTF-8, numeric/capacity boundaries, and corrupt/temp file preservation')
