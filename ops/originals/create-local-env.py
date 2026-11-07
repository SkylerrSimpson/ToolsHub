"""Create local-only random credentials without displaying them. Never overwrite existing config."""
from pathlib import Path
import secrets,os,argparse
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--workspace',type=Path,default=Path.home()/'tools-originals')
root=parser.parse_args().workspace.expanduser().resolve()
if any(not (root/repo/'backend/server.js').is_file() for repo in ['DictionaryApp','Devfinder','TodoList','TipApp']):
 raise SystemExit('Expected four maintained original checkouts with backend/server.js; no files changed.')
files=[root/'.env']+[root/repo/'backend/.env' for repo in ['DictionaryApp','Devfinder','TodoList','TipApp']]
if any(p.exists() for p in files):raise SystemExit('Existing environment file found; no files changed. Keep its database credentials or configure missing files manually.')
values={key:secrets.token_hex(24) for key in ['ORIGINALS_ADMIN_PASSWORD','DICTIONARY_PASSWORD','DEVFINDER_PASSWORD','TODO_PASSWORD']}
def private_write(path,text):
 fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
 with os.fdopen(fd,'w') as stream:stream.write(text)
private_write(root/'.env',''.join(f'{key}={value}\n' for key,value in values.items()))
for repo,name,port,key in [('DictionaryApp','dictionary',4101,'DICTIONARY_PASSWORD'),('Devfinder','devfinder',4102,'DEVFINDER_PASSWORD'),('TodoList','todo',4103,'TODO_PASSWORD')]:
 url=f'postgres://{name}_original:{values[key]}@127.0.0.1:55433/{name}_original'
 private_write(root/repo/'backend/.env',f'DATABASE_URL={url}\nORIGINAL_TEST_DATABASE_URL={url}_test\nPORT={port}\nAPP_ORIGIN=http://localhost:{port}\nCOOKIE_SECURE=false\n')
private_write(root/'TipApp/backend/.env','PORT=4104\n')
print('Created private local configuration for four originals. Credentials were not displayed.')
