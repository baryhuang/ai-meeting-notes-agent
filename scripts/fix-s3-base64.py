#!/usr/bin/env python3
"""Fix base64-encoded .txt files in S3 by-dates/ prefix."""
import base64
import re
import boto3

s3 = boto3.client('s3')
bucket = 'notesly-transcripts'

# List all .txt files under by-dates/
paginator = s3.get_paginator('list_objects_v2')
txt_keys = []
for page in paginator.paginate(Bucket=bucket, Prefix='by-dates/'):
    for obj in page.get('Contents', []):
        if obj['Key'].endswith('.txt'):
            txt_keys.append(obj['Key'])

print(f"Found {len(txt_keys)} .txt files")

fixed = 0
skipped = 0
errors = []

for key in txt_keys:
    resp = s3.get_object(Bucket=bucket, Key=key)
    body = resp['Body'].read()
    text = body.decode('utf-8', errors='replace')

    # Detect base64: first 40 chars are only base64 alphabet
    if re.match(r'^[A-Za-z0-9+/=\n\r]{40}', text):
        try:
            decoded = base64.b64decode(text.strip())
            # Verify it's valid UTF-8 text
            decoded.decode('utf-8')
            s3.put_object(
                Bucket=bucket, Key=key, Body=decoded,
                ContentType='text/plain; charset=utf-8',
                ServerSideEncryption='AES256'
            )
            fixed += 1
            print(f"  Fixed: {key.split('/')[-1]}")
        except Exception as e:
            errors.append(f"{key}: {e}")
            print(f"  Error: {key.split('/')[-1]}: {e}")
    else:
        skipped += 1

print(f"\nDone: {fixed} fixed, {skipped} already plain, {len(errors)} errors")
