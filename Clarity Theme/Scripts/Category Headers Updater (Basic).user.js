// ==UserScript==
// @name         MalFox Headers (Clarity Basic Style)
// @namespace    V.L
// @version      1.0
// @description  Generates CSS for modern list category headers and updates user CSS automatically.
// @author       Valerio Lyndon
// @match        https://myanimelist.net/animelist/*
// @match        https://myanimelist.net/mangalist/*
// @run-at       document-end
// @grant        none
// @licence      MIT
// ==/UserScript==

templateCss = `[data-query*='"status":7']:not([data-query*='order']):not([data-query*='tag"']):not([data-query*='"s"']) .list-item:nth-child($index){margin-top:48px;}[data-query*='"status":7']:not([data-query*='order']):not([data-query*='tag"']):not([data-query*='"s"']) .list-item:nth-child($index):before{content:'$content'}`;

animeManga = window.location.href.replace("https://myanimelist.net/", "").split("/")[0].replace("list", "");

function updateCss(newCss) {
	/* Determine theme currently being used */

	stylesheet = $('head style[type="text/css"]:first-of-type').text();

	style = false;
	styleColIndex = stylesheet.indexOf('background-color', stylesheet.indexOf('.list-unit .list-status-title {')) + 17;
	styleCol = stylesheet.substr(styleColIndex, 8).replaceAll(/\s|\:|\;/g, '');

	switch(styleCol) {
		case '#4065BA':
			if(stylesheet.indexOf('logo_mal_blue.png') !== -1)
			{
				style = 2;
			}
			else
			{
				style = 1;
			}
			break;
		case '#244291':
			style = 3;
			break;
		case '#23B230':
			style = 4;
			break;
		case '#A32E2E':
			style = 5;
			break;
		case '#FAD54A':
			style = 6;
			break;
		case '#0080FF':
			style = 7;
			break;
		case '#39c65d':
			style = 8;
			break;
		case '#ff00bf':
			style = 9;
			break;
		case '#DB1C03':
			style = 10;
			break;
	}

	if(style === false)
	{
		alert('Failed to update Custom CSS');
		return false;
	}

	/* Update MAL custom CSS */

	styleUrl = `https://myanimelist.net/ownlist/style/theme/${style}`;
	request = new XMLHttpRequest();
	request.open("get", styleUrl, false);
	request.send(null);
	str = request.responseText;
	doc = new DOMParser().parseFromString(request.responseText, "text/html");

	cssEle = $(doc).find('pre#custom-css');
	if(cssEle.length < 1) {
		return false;
	}

	currentCss = cssEle.text();

	/* Remove any previously added malfox CSS */
	currentCss = currentCss.replaceAll(/\/\*MALFOX.START(.|\n)*?MALFOX.END\*\//g, '');

	finalCss = currentCss + '\n\n/*MALFOX START*/\n/* DO NOT remove or restyle the MALFOX START or MALFOX END markers and DO NOT place any of your own code between these two markers. Doing so can cause deletion of your code. */\n' + newCss + '/*MALFOX END*/';
	
	if(finalCss.length >= 65535)
	{
		alert('Your MAL Custom CSS may be longer than the max allowed length. If your CSS has been cut off at the end, you will need to resolve this issue.');
	}

	/* Update the pages CSS to make sure no page reload is required */

	$('style#custom-css').text(finalCss);

	/* Send new CSS to MAL */
	
	csrf = $('meta[name="csrf_token"]').attr('content');
	boundary = '---------------------------35347544871910269115864526218';
	bg_attach = $(doc).find('#style_edit_theme_background_image_attachment').find('[selected]').val() || '';
	bg_vert = $(doc).find('#style_edit_theme_background_image_vertical_position').find('[selected]').val() || '';
	bg_hori = $(doc).find('#style_edit_theme_background_image_horizontal_position').find('[selected]').val() || '';
	bg_repeat = $(doc).find('#style_edit_theme_background_image_repeat').find('[selected]').val() || '';
	
	req2header = `--${boundary}\nContent-Disposition: form-data; name="style_edit_theme[show_cover_image]"\n\n1\n--${boundary}\nContent-Disposition: form-data; name="style_edit_theme[cover_image]"; filename=""\nContent-Type: application/octet-stream\n\n\n--${boundary}\nContent-Disposition: form-data; name="style_edit_theme[show_background_image]"\n\n1\n--${boundary}\nContent-Disposition: form-data; name="style_edit_theme[background_image]"; filename=""\nContent-Type: application/octet-stream\n\n\n--${boundary}\nContent-Disposition: form-data; name="style_edit_theme[background_image_attachment]"\n\n${bg_attach}\n--${boundary}\nContent-Disposition: form-data; name="style_edit_theme[background_image_vertical_position]"\n\n${bg_vert}\n--${boundary}\nContent-Disposition: form-data; name="style_edit_theme[background_image_horizontal_position]"\n\n${bg_hori}\n--${boundary}\nContent-Disposition: form-data; name="style_edit_theme[background_image_repeat]"\n\n${bg_repeat}\n--${boundary}\nContent-Disposition: form-data; name="style_edit_theme[css]"\n\n${finalCss}\n--${boundary}\nContent-Disposition: form-data; name="style_edit_theme[save]"\n\n\n--${boundary}\nContent-Disposition: form-data; name="csrf_token"\n\n${csrf}\n--${boundary}--`;
	
	request2 = new XMLHttpRequest();
	request2.open("post", styleUrl, false);
	request2.setRequestHeader("Content-Type", `multipart/form-data; boundary=${boundary}`);
	request2.send(req2header);

	return true;
}


function primary() {
	if(animeManga === 'anime') {
		var categories = {
			1: 'Watching',
			2: 'Completed',
			3: 'On Hold',
			4: 'Dropped',
			6: 'Plan To Watch'
		};
	} else {
		var categories = {
			1: 'Reading',
			2: 'Completed',
			3: 'On Hold',
			4: 'Dropped',
			6: 'Plan To Read'
		};
	}

	// Count how many of each list items there are in each category
	var itemsPerStatus = {
		1: 0,
		2: 0,
		3: 0,
		4: 0,
		6: 0
	};

	for(i = 0; i < data.length; i++) {
		itemsPerStatus[data[i]['status']]++;
	}

	itemsPerCategory = {};
	for(var [category, count] of Object.entries(itemsPerStatus)) {
		if(count > 0) {
			itemsPerCategory[categories[category]] = count;
		}
	}

	// create css
	outputCss = '';

	var currentPosition = 2;
	for(var [category, count] of Object.entries(itemsPerCategory)) {
		var position = currentPosition;

		outputCss +=  templateCss.replaceAll('$index', position).replaceAll('$content', category) + '\n';

		currentPosition += count;
	}

	// update user css
	updateCss(outputCss);
}


// preliminary data fetch which then calls primary function
var data = [];
baseUrl = window.location.href.split('?')[0];
offset = 0;
failures = 0;
faildelay = 0;
function preliminary()
{
	/* will take a list URL:
	https://myanimelist.net/animelist/Valerio_Lyndon?status=2
	and return:
	https://myanimelist.net/animelist/Valerio_Lyndon/load.json?status=7 */
	dataUrl = `${baseUrl}/load.json?status=7&offset=${offset}`;

	$.getJSON(dataUrl, function(json)
	{
		failures = 0;
		data = data.concat(json);

		if(json.length === 300)
		{
			offset += 300;
			preliminary();
		} else {
			primary();
			return;
		}
	}).fail(function()
	{
		failures++;
		faildelay += 3000;

		if(failures > 3)
		{
			alert('Failed to update headers.');
			return;
		}

		setTimeout(preliminary, faildelay);
	});
};

// Check if it should run
modernStyle = (document.getElementById("list_surround")) ? false : true;
listOwner = document.body.getAttribute('data-owner') === '1' ? true : false;

if(modernStyle && listOwner) {
	preliminary();
} else {
	console.log('Headers are disabled on clasic lists and other user lists.');
}