import {readFile,writeFile} from 'node:fs/promises';
import {retainPublishedReleases} from './retain-releases.mjs';
const directory='.build/site',source=process.env.PUBLISHED_COURSE_URL;
if(source){const release=JSON.parse(await readFile(`${directory}/release.json`));release.retainedReleases=await retainPublishedReleases(directory,source,{currentId:release.id});for(const file of ['release.json',`releases/${release.id}/release.json`])await writeFile(`${directory}/${file}`,JSON.stringify(release));}
