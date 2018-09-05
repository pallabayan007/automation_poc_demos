if ( CKEDITOR.env.ie && CKEDITOR.env.version < 9 )
	CKEDITOR.tools.enableHtml5Elements( document );

CKEDITOR.config.height = 250;
CKEDITOR.config.width = 840;

var initSample = ( function() {
	var wysiwygareaAvailable = isWysiwygareaAvailable(),
		isBBCodeBuiltIn = !!CKEDITOR.plugins.get( 'bbcode' );

	return function() {
		var editorElement = CKEDITOR.document.getById( 'editor' );
		if ( isBBCodeBuiltIn ) {
			editorElement.setHtml(
				
			);
		}

		if ( wysiwygareaAvailable ) {
			CKEDITOR.replace( 'editor', {
				extraPlugins : 'imagebrowser',
				imageBrowser_listUrl : "browser.json",
				filebrowserBrowseUrl: '',
				filebrowserImageBrowseUrl: '../../lib/rtEditor/plugins/imagebrowser/browser/browser.html?type=Images',
				filebrowserUploadUrl: '../../lib/rtEditor/plugins/imagebrowser/browser/browser.html?type=Files',
				filebrowserImageUploadUrl: '../../lib/rtEditor/plugins/imagebrowser/browser/browser.html?type=Files'
			} );
		} else {
			editorElement.setAttribute( 'contenteditable', 'true' );
			CKEDITOR.inline( 'editor' );
		}
	};

	function isWysiwygareaAvailable() {
		if ( CKEDITOR.revision == ( '%RE' + 'V%' ) ) {
			return true;
		}

		return !!CKEDITOR.plugins.get( 'wysiwygarea' );
	}
} )();

var initSampleUpdate = ( function() {
	var wysiwygareaAvailable = isWysiwygareaAvailable(),
		isBBCodeBuiltIn = !!CKEDITOR.plugins.get( 'bbcode' );

	return function() {
		var editorElement = CKEDITOR.document.getById( 'editorUpdate' );
		if ( isBBCodeBuiltIn ) {
			editorElement.setHtml(
				
			);
		}

		if ( wysiwygareaAvailable ) {
			CKEDITOR.replace( 'editorUpdate', {
				extraPlugins : 'imagebrowser',
				imageBrowser_listUrl : "browser.json",
				filebrowserBrowseUrl: '',
				filebrowserImageBrowseUrl: '../../lib/rtEditor/plugins/imagebrowser/browser/browser.html?type=Images',
				filebrowserUploadUrl: '../../lib/rtEditor/plugins/imagebrowser/browser/browser.html?type=Files',
				filebrowserImageUploadUrl: '../../lib/rtEditor/plugins/imagebrowser/browser/browser.html?type=Files'
			} );
		} else {
			editorElement.setAttribute( 'contenteditable', 'true' );
			CKEDITOR.inline( 'editorUpdate' );
		}
	};

	function isWysiwygareaAvailable() {
		if ( CKEDITOR.revision == ( '%RE' + 'V%' ) ) {
			return true;
		}

		return !!CKEDITOR.plugins.get( 'wysiwygarea' );
	}
} )();

var initSampleUpdate = ( function() {
	var wysiwygareaAvailable = isWysiwygareaAvailable(),
		isBBCodeBuiltIn = !!CKEDITOR.plugins.get( 'bbcode' );

	return function() {
		var editorElement = CKEDITOR.document.getById( 'editorUpdate' );
		if ( isBBCodeBuiltIn ) {
			editorElement.setHtml(
				
			);
		}

		if ( wysiwygareaAvailable ) {
			CKEDITOR.replace( 'editorUpdate' );
		} else {
			editorElement.setAttribute( 'contenteditable', 'true' );
			CKEDITOR.inline( 'editorUpdate' );
		}
	};

	function isWysiwygareaAvailable() {
		if ( CKEDITOR.revision == ( '%RE' + 'V%' ) ) {
			return true;
		}

		return !!CKEDITOR.plugins.get( 'wysiwygarea' );
	}
} )();

