// ==UserScript==
// @name         MalFox Headers (Clarity Basic Style)
// @namespace    V.L
// @version      2.1
// @description  Generates CSS for modern list category headers and updates user CSS automatically.
// @author       Valerio Lyndon
// @match        https://myanimelist.net/animelist/*
// @match        https://myanimelist.net/mangalist/*
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// @licence      MIT
// ==/UserScript==

templateCss = `.$type[data-query*='"status":7']:not([data-query*='order']):not([data-query*='tag"']):not([data-query*='"s"']) .list-item:nth-child($index){margin-top:48px;}.$type[data-query*='"status":7']:not([data-query*='order']):not([data-query*='tag"']):not([data-query*='"s"']) .list-item:nth-child($index):before{content:'$content'}`;

animeManga = window.location.href.replace("https://myanimelist.net/", "").split("/")[0].replace("list", "");

function debug_info() {
	// Browser version
    var ua=navigator.userAgent,tem,M=ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*([\d\.]+)/i) || [];
    if(/trident/i.test(M[1])){
        tem=/\brv[ :]+(\d+)/g.exec(ua) || [];
        return {name:'IE',version:(tem[1]||'')};
        }
    if(M[1]==='Chrome'){
        tem=ua.match(/\bEdg\/(\d+)/)
        if(tem!=null)   {return {name:'Edge(Chromium)', version:tem[1]};}
        tem=ua.match(/\bOPR\/(\d+)/)
        if(tem!=null)   {return {name:'Opera', version:tem[1]};}
        }
    M=M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem=ua.match(/version\/(\d+)/i))!=null) {M.splice(1,1,tem[1]);}
	var browser = `${M[0]} ${M[1]}`;
	
    return `MalFox v2.1 // ${browser}`;
 }

function report(msg, details = false) {
    if(details) {
        debug = debug_info();

        msg += `\n\nDetails: ${details}.\n${debug}`
    }

    alert(msg);
}

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
		report('MalFox failed to update your header locations.', 'MalFox could not identify the selected list style');
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
	replace = `\\n{0,2}\\/\\*malfox.${animeManga}.{0,1}start(.|\\n)*?malfox.${animeManga}.{0,1}end\\*\\/`;
	expression = new RegExp(replace, "gi");
	currentCss = currentCss.replaceAll(expression, '');

	finalCss = `${currentCss}\n\n/*MALFOX ${animeManga.toUpperCase()} START*/\n/* DO NOT remove or restyle the MALFOX START or MALFOX END markers and DO NOT place any of your own code between these two markers. Doing so can cause deletion of your code. */\n${newCss}/*MALFOX ${animeManga.toUpperCase()} END*/`;

	if(finalCss.length >= 65535)
	{
		report(`Your Custom CSS may be longer than the maximum allowed length. Please visit your style page at https://myanimelist.net/ownlist/style/theme/${style} and check if your CSS has been cut off at the end.\n\n If you do not see the "MALFOX END" marker at the bottom of your CSS, you need to reduce your CSS length. Make sure to remove the "MALFOX START" marker and anything after it to prevent issue with this script later on.`);
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

	GM_setValue('lastRun', Date.now());

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

	// fetch and search list info for total amount in each category
	baseUrl = window.location.href.split('?')[0];
	offset = 0;
	failures = 0;
	faildelay = 0;
	(function fetchListInfo()
	{
		/* will take a list URL:
		https://myanimelist.net/animelist/Valerio_Lyndon?status=2
		and return:
		https://myanimelist.net/animelist/Valerio_Lyndon/load.json?status=7 */
		dataUrl = `${baseUrl}/load.json?status=7&offset=${offset}`;

		$.getJSON(dataUrl, function(json)
		{
			failures = 0;
			
			// add count to total
			for(i = 0; i < json.length; i++) {
				var status = json[i]['status'];
				itemsPerStatus[status]++;
				if(status === 6) {
					generateCss();
					return;
				}
			}

			if(json.length === 300)
			{
				offset += 300;
				fetchListInfo();
			} else {
				generateCss();
				return;
			}
		}).fail(function()
		{
			failures++;
			faildelay += 3000;

			if(failures > 3)
			{
				report('MalFox failed to update your header locations.', 'MalFox failed to fetch list info while updating your headers. If this error appears more than once, please report it in the forum thread. https://myanimelist.net/forum/?topicid=1723114');
				return;
			}

			setTimeout(fetchListInfo, faildelay);
		});
	})();

	// Generates CSS once list info is fetched. This function is called from fetchListInfo function.
	function generateCss() {
		// provides items per category. plantowatch will not list the correct amount since the fetch tool stops after 1 for optimization reasons
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

			outputCss +=  templateCss.replaceAll('$index', position).replaceAll('$content', category).replaceAll('$type', animeManga) + '\n';

			currentPosition += count;
		}

		// update user css
		updateCss(outputCss);
	}
}

// Check if it should run
timeSinceLastRun = Date.now() - GM_getValue('lastRun');
isModernStyle = (document.getElementById("list_surround")) ? false : true;
isListOwner = document.body.getAttribute('data-owner') === '1' ? true : false;
let searchParams = new URLSearchParams(window.location.search);
isPreview = searchParams.has('preview');
isClarity = $('#advanced-options-button').css('width') === '26px' && $('#advanced-options-button').css('height') === '26px' && $('#advanced-options-button').css('border-top-left-radius') === '13px' ? true : false

if(!isModernStyle) {
	console.log("[MalFox] Headers are disabled on clasic lists.");
}
else if(!isListOwner) {
	console.log("[MalFox] Headers are disabled on other users' lists.");
}
else if(isPreview) {
	console.log("[MalFox] Headers are disabled while previewing list.")
}
else if(!isClarity) {
	console.log("[MalFox] Headers are disabled on lists that aren't using the Clarity theme. If you are using the Clarity theme, there has been an error in the code.");
}
else if(timeSinceLastRun < 60000) {
	timeUntilNextRun = Math.floor((60000 - timeSinceLastRun) / 1000);
	console.log(`[MalFox] Headers will not update more than once a minute. Please wait ${timeUntilNextRun} seconds and try again.`);
}
else {
	primary();
}