# Diff a JSON

Will fetch, sort (by key), and diff JSON data from 2 given sources (local file or API request).

As default, before comparing the data, each object will be sorted to depth=infinity in order to get the most accurate 
  comparison possible.


## Examples

```bash
diffajson somedata.json http://example.com/json-api-request?a=1 --sidebyside

diffajson ~/path/to/somedata.json http://example.com/json-api-request?a=1 \
	--savelocal --sidebyside --saveas diff.diff

diffajson http://example.com/json-api-request?a=1 http://example.com/json-api-request?a=2 \
	--savelocal --saveonly
```

## Install
`npm install -g diffajson`


## Arguments

| name | description |
|------|-------------|
--nosort | disables sorting the json object before diff
--savelocal | will save the fetched json files locally as left-[timestamp].json and right-[timestamp].json
--saveonly | will not run actual diff, to be used in conjunction with --savelocal
--sidebyside | will return the diff in a side-by-side view
--saveas filename | will save the diff instead of outputting it


## Caveats and Workarounds

Authentication (except for Basic Auth) is not currently built-in.
Hint: to fetch a file from a source with cookie-based Authentication, do the following:
 
```bash
curl -XPOST https://example.com/auth/signin --data "user=username&password=userpassword" -c cookies
curl http://example.com/json-api-request -b cookies >> data.json
```