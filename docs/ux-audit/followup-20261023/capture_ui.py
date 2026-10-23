"""Reuse prior matrix, waiting for reveal transitions to finish before contrast checks."""
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'phase-2/capture_ui.py'
source=p.read_text();needle='await page.wait_for_timeout(600)'
assert needle in source
exec(compile(source.replace(needle,'await page.wait_for_timeout(1500)'),str(p),'exec'),{'__file__':str(p),'__name__':'__main__'})
