const fs = require('fs');
const axios = require('axios');
const packageJSON = require('../package.json');
const VS_MARKET_PAGE_URL = 'https://marketplace.visualstudio.com/items?itemName=';

async function fetchVSExtnensionMetaAll (extensionsArr) {
	return await Promise.all(extensionsArr.map(fetchVSExtnensionMeta));
}

async function fetchVSExtnensionMeta(pluginCode) {
	const VS_MARKET_API_URL = 'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery';
	const data = JSON.stringify({
		"assetTypes": null,
		"filters": [{
			"criteria": [{
				"filterType": 7,
				"value": pluginCode
			}],
			"direction": 2,
			"pageSize": 100,
			"pageNumber": 1,
			"sortBy": 0,
			"sortOrder": 0,
			"pagingToken": null
		}],
		"flags": 71
	});

	const config = {
		headers: {
			'Accept': 'application/json;api-version=5.2-preview.1;excludeUrls=true',
			'Content-Type': 'application/json',
			'Accept-Language': 'en-US,en;q=0.9,uk;q=0.8,ru;q=0.7'
		}
	}

	return await axios.post(VS_MARKET_API_URL, data, config);
}

function formatterExtensionMD (meta, marketURL) {
	const extensionMeta = meta.data.results[0].extensions[0];
	const name = extensionMeta.displayName;
	const url = marketURL + extensionMeta.publisher.publisherName + '.' + extensionMeta.extensionName;
	const description = extensionMeta.shortDescription;
	return `* [${name}](${url}) - ${description}`;
}

function formatterErrorMD (errorRespone) {
	const errorMarker = '* ::: VS CODE MARKETPLACE ERROR :::';
	console.error(errorMarker + '\n');
	console.error(errorRespone);
	console.error('\n' + errorMarker);
	return [errorMarker, errorRespone.status, errorRespone.statusText, ' ::: NO EXTENSION'].join(' ')
}

async function makeReadme() {
	const headerTextMD = [`# ${packageJSON.displayName}`, packageJSON.description, `It includes:`].join('\n');
	const responedMetaArr = await fetchVSExtnensionMetaAll(packageJSON.extensionPack);
	const contentMD = responedMetaArr
		.map(res =>
			(200 >= res.status < 400) && res.data.results[0].extensions.length ?
				formatterExtensionMD(res, VS_MARKET_PAGE_URL) :
				formatterErrorMD(res)
		)
		.join('\n');

	fs.writeFileSync('README.md', headerTextMD + '\n' + contentMD);

}

makeReadme();