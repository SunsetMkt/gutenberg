/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo, useRef } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import {
	BlockList,
	BlockInspector,
	BlockTools,
	__unstableUseClipboardHandler as useClipboardHandler,
	__unstableUseTypingObserver as useTypingObserver,
	BlockEditorKeyboardShortcuts,
	store as blockEditorStore,
} from '@wordpress/block-editor';

import {
	useMergeRefs,
	useViewportMatch,
	useResizeObserver,
} from '@wordpress/compose';
import { ReusableBlocksMenuItems } from '@wordpress/reusable-blocks';

/**
 * Internal dependencies
 */
import inserterMediaCategories from './inserter-media-categories';
import TemplatePartConverter from '../template-part-converter';
import { SidebarInspectorFill } from '../sidebar-edit-mode';
import { store as editSiteStore } from '../../store';
import BackButton from './back-button';
import ResizableEditor from './resizable-editor';
import EditorCanvas from './editor-canvas';
import { unlock } from '../../lock-unlock';
import EditorCanvasContainer from '../editor-canvas-container';
import {
	DisableNonPageContentBlocks,
	usePageContentFocusNotifications,
} from '../page-content-focus';
import DefaultBlockEditor from './default-block-editor';
import NavigationBlockEditor from './navigation-block-editor';

const LAYOUT = {
	type: 'default',
	// At the root level of the site editor, no alignments should be allowed.
	alignments: [],
};

const FOCUSABLE_ENTITIES = [ 'wp_template_part', 'wp_navigation' ];

export default function BlockEditor() {
	const { templateType, hasPageContentFocus } = useSelect( ( select ) => {
		const { getEditedPostType, hasPageContentFocus: _hasPageContentFocus } =
			unlock( select( editSiteStore ) );

		return {
			templateType: getEditedPostType(),
			hasPageContentFocus: _hasPageContentFocus(),
		};
	}, [] );

	const settings = useSiteEditorSettings( templateType );

	const BlockEditorComponent = getBlockEditorComponent( templateType );

	return (
		<BlockEditorComponent templateType={ templateType }>
			{ hasPageContentFocus && <DisableNonPageContentBlocks /> }
			<TemplatePartConverter />
			<SidebarInspectorFill>
				<BlockInspector />
			</SidebarInspectorFill>

			<SiteEditorCanvas
				settings={ settings }
				templateType={ templateType }
			/>

			<ReusableBlocksMenuItems />
		</BlockEditorComponent>
	);
}

/**
 * Factory to isolate choosing the appropriate block editor
 * component to handle a given template type/entity.
 *
 * @param {string} templateType the template (entity) type being edited
 * @return {JSX.Element} the block editor component to use.
 */
function getBlockEditorComponent( templateType ) {
	let Component = null;

	switch ( templateType ) {
		case 'wp_navigation':
			Component = NavigationBlockEditor;
			break;
		default:
			Component = DefaultBlockEditor;
			break;
	}

	return Component;
}

function SiteEditorCanvas( { templateType } ) {
	const { clearSelectedBlock } = useDispatch( blockEditorStore );
	const { isViewMode, isFocusMode } = useSiteEditorMode();
	const [ resizeObserver, sizes ] = useResizeObserver();

	const settings = useSiteEditorSettings();

	// Get the blocks directly from the block editor store.
	const { blocks } = useSelect( ( select ) => {
		const { getBlocks } = select( blockEditorStore );
		return {
			blocks: getBlocks(),
		};
	}, [] );

	const isMobileViewport = useViewportMatch( 'small', '<' );
	const enableResizing =
		isFocusMode &&
		! isViewMode &&
		// Disable resizing in mobile viewport.
		! isMobileViewport;

	const contentRef = useRef();
	const mergedRefs = useMergeRefs( [
		contentRef,
		useClipboardHandler(),
		useTypingObserver(),
		usePageContentFocusNotifications(),
	] );

	const isTemplateTypeNavigation = templateType === 'wp_navigation';
	const hasBlocks = blocks?.length !== 0;

	const showBlockAppender =
		( isTemplateTypeNavigation && isFocusMode && hasBlocks ) || isViewMode
			? false
			: undefined;

	return (
		<EditorCanvasContainer.Slot>
			{ ( [ editorCanvasView ] ) =>
				editorCanvasView ? (
					<div className="edit-site-visual-editor is-focus-mode">
						{ editorCanvasView }
					</div>
				) : (
					<BlockTools
						className={ classnames( 'edit-site-visual-editor', {
							'is-focus-mode': isFocusMode || !! editorCanvasView,
							'is-view-mode': isViewMode,
						} ) }
						__unstableContentRef={ contentRef }
						onClick={ ( event ) => {
							// Clear selected block when clicking on the gray background.
							if ( event.target === event.currentTarget ) {
								clearSelectedBlock();
							}
						} }
					>
						<BlockEditorKeyboardShortcuts.Register />
						<BackButton />
						<ResizableEditor
							enableResizing={ enableResizing }
							height={ sizes.height ?? '100%' }
						>
							<EditorCanvas
								enableResizing={ enableResizing }
								settings={ settings }
								contentRef={ mergedRefs }
								readonly={ isViewMode }
							>
								{ resizeObserver }
								<BlockList
									className={ classnames(
										'edit-site-block-editor__block-list wp-site-blocks',
										{
											'is-navigation-block':
												isTemplateTypeNavigation,
										}
									) }
									__experimentalLayout={ LAYOUT }
									renderAppender={ showBlockAppender }
								/>
							</EditorCanvas>
						</ResizableEditor>
					</BlockTools>
				)
			}
		</EditorCanvasContainer.Slot>
	);
}

export function useSiteEditorMode() {
	const { templateType, canvasMode } = useSelect( ( select ) => {
		const { getEditedPostType, getCanvasMode } = unlock(
			select( editSiteStore )
		);

		return {
			templateType: getEditedPostType(),
			canvasMode: getCanvasMode(),
		};
	}, [] );

	return {
		isFocusMode: FOCUSABLE_ENTITIES.includes( templateType ),
		isViewMode: canvasMode === 'view',
		isEditMode: canvasMode === 'edit',
	};
}

export function useSiteEditorSettings( templateType ) {
	const { storedSettings } = useSelect( ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );

		return {
			storedSettings: getSettings(),
		};
	}, [] );

	const isNavigationFocusMode = templateType === 'wp_navigation';

	const settingsBlockPatterns =
		storedSettings.__experimentalAdditionalBlockPatterns ?? // WP 6.0
		storedSettings.__experimentalBlockPatterns; // WP 5.9
	const settingsBlockPatternCategories =
		storedSettings.__experimentalAdditionalBlockPatternCategories ?? // WP 6.0
		storedSettings.__experimentalBlockPatternCategories; // WP 5.9

	const { restBlockPatterns, restBlockPatternCategories } = useSelect(
		( select ) => ( {
			restBlockPatterns: select( coreStore ).getBlockPatterns(),
			restBlockPatternCategories:
				select( coreStore ).getBlockPatternCategories(),
		} ),
		[]
	);
	const blockPatterns = useMemo(
		() =>
			[
				...( settingsBlockPatterns || [] ),
				...( restBlockPatterns || [] ),
			]
				.filter(
					( x, index, arr ) =>
						index === arr.findIndex( ( y ) => x.name === y.name )
				)
				.filter( ( { postTypes } ) => {
					return (
						! postTypes ||
						( Array.isArray( postTypes ) &&
							postTypes.includes( templateType ) )
					);
				} ),
		[ settingsBlockPatterns, restBlockPatterns, templateType ]
	);

	const blockPatternCategories = useMemo(
		() =>
			[
				...( settingsBlockPatternCategories || [] ),
				...( restBlockPatternCategories || [] ),
			].filter(
				( x, index, arr ) =>
					index === arr.findIndex( ( y ) => x.name === y.name )
			),
		[ settingsBlockPatternCategories, restBlockPatternCategories ]
	);
	return useMemo( () => {
		const {
			__experimentalAdditionalBlockPatterns,
			__experimentalAdditionalBlockPatternCategories,
			...restStoredSettings
		} = storedSettings;

		return {
			...restStoredSettings,
			inserterMediaCategories,
			__experimentalBlockPatterns: blockPatterns,
			__experimentalBlockPatternCategories: blockPatternCategories,
			// Template locking must be explicitly "unset" for non-navigation entities.
			templateLock: isNavigationFocusMode ? 'insert' : false,
			template: isNavigationFocusMode
				? [ [ 'core/navigation', {}, [] ] ]
				: false,
		};
	}, [
		storedSettings,
		blockPatterns,
		blockPatternCategories,
		isNavigationFocusMode,
	] );
}
