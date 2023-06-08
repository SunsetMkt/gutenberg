/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	BaseControl,
	PanelBody,
	Placeholder,
	QueryControls,
	RadioControl,
	RangeControl,
	Spinner,
	ToggleControl,
	ToolbarGroup,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { dateI18n, format, getSettings } from '@wordpress/date';
import {
	InspectorControls,
	BlockAlignmentToolbar,
	BlockControls,
	__experimentalImageSizeControl as ImageSizeControl,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { pin, list, grid } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticeStore } from '@wordpress/notices';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	MIN_EXCERPT_LENGTH,
	MAX_EXCERPT_LENGTH,
	MAX_POSTS_COLUMNS,
} from './constants';

/**
 * Module Constants
 */
const CATEGORIES_LIST_QUERY = {
	per_page: -1,
	context: 'view',
};
const USERS_LIST_QUERY = {
	per_page: -1,
	has_published_posts: [ 'post' ],
	context: 'view',
};

function getFeaturedImageDetails( post, size ) {
	const image = post._embedded?.[ 'wp:featuredmedia' ]?.[ '0' ];

	return {
		url:
			image?.media_details?.sizes?.[ size ]?.source_url ??
			image?.source_url,
		alt: image?.alt_text,
	};
}

export default function LatestPostsEdit( { attributes, setAttributes } ) {
	const instanceId = useInstanceId( LatestPostsEdit );
	const {
		postsToShow,
		order,
		orderBy,
		categories,
		selectedAuthor,
		displayFeaturedImage,
		displayPostContentRadio,
		displayPostContent,
		displayPostDate,
		displayAuthor,
		postLayout,
		columns,
		excerptLength,
		featuredImageAlign,
		featuredImageSizeSlug,
		featuredImageSizeWidth,
		featuredImageSizeHeight,
		addLinkToFeaturedImage,
	} = attributes;
	const {
		imageSizes,
		latestPosts,
		defaultImageWidth,
		defaultImageHeight,
		categoriesList,
		authorList,
	} = useSelect(
		( select ) => {
			const { getEntityRecords, getUsers } = select( coreStore );
			const settings = select( blockEditorStore ).getSettings();
			const catIds =
				categories && categories.length > 0
					? categories.map( ( cat ) => cat.id )
					: [];
			const latestPostsQuery = Object.fromEntries(
				Object.entries( {
					categories: catIds,
					author: selectedAuthor,
					order,
					orderby: orderBy,
					per_page: postsToShow,
					_embed: 'wp:featuredmedia',
				} ).filter( ( [ , value ] ) => typeof value !== 'undefined' )
			);

			return {
				defaultImageWidth:
					settings.imageDimensions?.[ featuredImageSizeSlug ]
						?.width ?? 0,
				defaultImageHeight:
					settings.imageDimensions?.[ featuredImageSizeSlug ]
						?.height ?? 0,
				imageSizes: settings.imageSizes,
				latestPosts: getEntityRecords(
					'postType',
					'post',
					latestPostsQuery
				),
				categoriesList: getEntityRecords(
					'taxonomy',
					'category',
					CATEGORIES_LIST_QUERY
				),
				authorList: getUsers( USERS_LIST_QUERY ),
			};
		},
		[
			featuredImageSizeSlug,
			postsToShow,
			order,
			orderBy,
			categories,
			selectedAuthor,
		]
	);

	// If a user clicks to a link prevent redirection and show a warning.
	const { createWarningNotice, removeNotice } = useDispatch( noticeStore );
	let noticeId;
	const showRedirectionPreventedNotice = ( event ) => {
		event.preventDefault();
		// Remove previous warning if any, to show one at a time per block.
		removeNotice( noticeId );
		noticeId = `block-library/core/latest-posts/redirection-prevented/${ instanceId }`;
		createWarningNotice( __( 'Links are disabled in the editor.' ), {
			id: noticeId,
			type: 'snackbar',
		} );
	};

	const imageSizeOptions = imageSizes
		.filter( ( { slug } ) => slug !== 'full' )
		.map( ( { name, slug } ) => ( {
			value: slug,
			label: name,
		} ) );
	const categorySuggestions =
		categoriesList?.reduce(
			( accumulator, category ) => ( {
				...accumulator,
				[ category.name ]: category,
			} ),
			{}
		) ?? {};
	const selectCategories = ( tokens ) => {
		const hasNoSuggestion = tokens.some(
			( token ) =>
				typeof token === 'string' && ! categorySuggestions[ token ]
		);
		if ( hasNoSuggestion ) {
			return;
		}
		// Categories that are already will be objects, while new additions will be strings (the name).
		// allCategories nomalizes the array so that they are all objects.
		const allCategories = tokens.map( ( token ) => {
			return typeof token === 'string'
				? categorySuggestions[ token ]
				: token;
		} );
		// We do nothing if the category is not selected
		// from suggestions.
		if ( allCategories.includes( null ) ) {
			return false;
		}
		setAttributes( { categories: allCategories } );
	};

	const hasPosts = !! latestPosts?.length;
	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Post content' ) }>
				<ToggleControl
					label={ __( 'Post content' ) }
					checked={ displayPostContent }
					onChange={ ( value ) =>
						setAttributes( { displayPostContent: value } )
					}
				/>
				{ displayPostContent && (
					<RadioControl
						label={ __( 'Show:' ) }
						selected={ displayPostContentRadio }
						options={ [
							{ label: __( 'Excerpt' ), value: 'excerpt' },
							{
								label: __( 'Full post' ),
								value: 'full_post',
							},
						] }
						onChange={ ( value ) =>
							setAttributes( {
								displayPostContentRadio: value,
							} )
						}
					/>
				) }
				{ displayPostContent &&
					displayPostContentRadio === 'excerpt' && (
						<RangeControl
							__nextHasNoMarginBottom
							label={ __( 'Max number of words' ) }
							value={ excerptLength }
							onChange={ ( value ) =>
								setAttributes( { excerptLength: value } )
							}
							min={ MIN_EXCERPT_LENGTH }
							max={ MAX_EXCERPT_LENGTH }
						/>
					) }
			</PanelBody>

			<PanelBody title={ __( 'Post meta' ) }>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Display author name' ) }
					checked={ displayAuthor }
					onChange={ ( value ) =>
						setAttributes( { displayAuthor: value } )
					}
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Display post date' ) }
					checked={ displayPostDate }
					onChange={ ( value ) =>
						setAttributes( { displayPostDate: value } )
					}
				/>
			</PanelBody>

			<PanelBody title={ __( 'Featured image' ) }>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Display featured image' ) }
					checked={ displayFeaturedImage }
					onChange={ ( value ) =>
						setAttributes( { displayFeaturedImage: value } )
					}
				/>
				{ displayFeaturedImage && (
					<>
						<ImageSizeControl
							onChange={ ( value ) => {
								setAttributes( {
									featuredImageSizeWidth: value.width,
									featuredImageSizeHeight: value.height,
								} );
							} }
							slug={ featuredImageSizeSlug }
							width={ featuredImageSizeWidth }
							height={ featuredImageSizeHeight }
							naturalWidth={ defaultImageWidth }
							naturalHeight={ defaultImageHeight }
							imageSizeOptions={ imageSizeOptions }
							imageSizeHelp={ __(
								'Select the size of the source image.'
							) }
							onChangeImage={ ( value ) =>
								setAttributes( {
									featuredImageSizeSlug: value,
									featuredImageSizeWidth: undefined,
									featuredImageSizeHeight: undefined,
								} )
							}
						/>
						<BaseControl className="editor-latest-posts-image-alignment-control">
							<BaseControl.VisualLabel>
								{ __( 'Image alignment' ) }
							</BaseControl.VisualLabel>
							<BlockAlignmentToolbar
								value={ featuredImageAlign }
								onChange={ ( value ) =>
									setAttributes( {
										featuredImageAlign: value,
									} )
								}
								controls={ [ 'left', 'center', 'right' ] }
								isCollapsed={ false }
							/>
						</BaseControl>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Add link to featured image' ) }
							checked={ addLinkToFeaturedImage }
							onChange={ ( value ) =>
								setAttributes( {
									addLinkToFeaturedImage: value,
								} )
							}
						/>
					</>
				) }
			</PanelBody>

			<PanelBody title={ __( 'Sorting and filtering' ) }>
				<QueryControls
					{ ...{ order, orderBy } }
					numberOfItems={ postsToShow }
					onOrderChange={ ( value ) =>
						setAttributes( { order: value } )
					}
					onOrderByChange={ ( value ) =>
						setAttributes( { orderBy: value } )
					}
					onNumberOfItemsChange={ ( value ) =>
						setAttributes( { postsToShow: value } )
					}
					categorySuggestions={ categorySuggestions }
					onCategoryChange={ selectCategories }
					selectedCategories={ categories }
					onAuthorChange={ ( value ) =>
						setAttributes( {
							selectedAuthor:
								'' !== value ? Number( value ) : undefined,
						} )
					}
					authorList={ authorList ?? [] }
					selectedAuthorId={ selectedAuthor }
				/>

				{ postLayout === 'grid' && (
					<RangeControl
						__nextHasNoMarginBottom
						label={ __( 'Columns' ) }
						value={ columns }
						onChange={ ( value ) =>
							setAttributes( { columns: value } )
						}
						min={ 2 }
						max={
							! hasPosts
								? MAX_POSTS_COLUMNS
								: Math.min(
										MAX_POSTS_COLUMNS,
										latestPosts.length
								  )
						}
						required
					/>
				) }
			</PanelBody>
		</InspectorControls>
	);

	const blockProps = useBlockProps( {
		className: classnames( {
			'wp-block-latest-posts__list': true,
			'is-grid': postLayout === 'grid',
			'has-dates': displayPostDate,
			'has-author': displayAuthor,
			[ `columns-${ columns }` ]: postLayout === 'grid',
		} ),
	} );

	if ( ! hasPosts ) {
		return (
			<div { ...blockProps }>
				{ inspectorControls }
				<Placeholder icon={ pin } label={ __( 'Latest Posts' ) }>
					{ ! Array.isArray( latestPosts ) ? (
						<Spinner />
					) : (
						__( 'No posts found.' )
					) }
				</Placeholder>
			</div>
		);
	}

	// Removing posts from display should be instant.
	const displayPosts =
		latestPosts.length > postsToShow
			? latestPosts.slice( 0, postsToShow )
			: latestPosts;

	const layoutControls = [
		{
			icon: list,
			title: __( 'List view' ),
			onClick: () => setAttributes( { postLayout: 'list' } ),
			isActive: postLayout === 'list',
		},
		{
			icon: grid,
			title: __( 'Grid view' ),
			onClick: () => setAttributes( { postLayout: 'grid' } ),
			isActive: postLayout === 'grid',
		},
	];

	const dateFormat = getSettings().formats.date;

	return (
		<div>
			{ inspectorControls }
			<BlockControls>
				<ToolbarGroup controls={ layoutControls } />
			</BlockControls>
			<ul { ...blockProps }>
				{ displayPosts.map( ( post ) => {
					const titleTrimmed = post.title.rendered.trim();
					let excerpt = post.excerpt.rendered;
					const currentAuthor = authorList?.find(
						( author ) => author.id === post.author
					);

					const excerptElement = document.createElement( 'div' );
					excerptElement.innerHTML = excerpt;

					excerpt =
						excerptElement.textContent ||
						excerptElement.innerText ||
						'';

					const { url: imageSourceUrl, alt: featuredImageAlt } =
						getFeaturedImageDetails( post, featuredImageSizeSlug );
					const imageClasses = classnames( {
						'wp-block-latest-posts__featured-image': true,
						[ `align${ featuredImageAlign }` ]:
							!! featuredImageAlign,
					} );
					const renderFeaturedImage =
						displayFeaturedImage && imageSourceUrl;
					const featuredImage = renderFeaturedImage && (
						<img
							src={ imageSourceUrl }
							alt={ featuredImageAlt }
							style={ {
								maxWidth: featuredImageSizeWidth,
								maxHeight: featuredImageSizeHeight,
							} }
						/>
					);

					const needsReadMore =
						excerptLength < excerpt.trim().split( ' ' ).length &&
						post.excerpt.raw === '';

					const postExcerpt = needsReadMore ? (
						<>
							{ excerpt
								.trim()
								.split( ' ', excerptLength )
								.join( ' ' ) }
							{ /* translators: excerpt truncation character, default …  */ }
							{ __( ' … ' ) }
							<a
								href={ post.link }
								rel="noopener noreferrer"
								onClick={ showRedirectionPreventedNotice }
							>
								{ __( 'Read more' ) }
							</a>
						</>
					) : (
						excerpt
					);

					return (
						<li key={ post.id }>
							{ renderFeaturedImage && (
								<div className={ imageClasses }>
									{ addLinkToFeaturedImage ? (
										<a
											className="wp-block-latest-posts__post-title"
											href={ post.link }
											rel="noreferrer noopener"
											onClick={
												showRedirectionPreventedNotice
											}
										>
											{ featuredImage }
										</a>
									) : (
										featuredImage
									) }
								</div>
							) }
							<a
								href={ post.link }
								rel="noreferrer noopener"
								dangerouslySetInnerHTML={
									!! titleTrimmed
										? {
												__html: titleTrimmed,
										  }
										: undefined
								}
								onClick={ showRedirectionPreventedNotice }
							>
								{ ! titleTrimmed ? __( '(no title)' ) : null }
							</a>
							{ displayAuthor && currentAuthor && (
								<div className="wp-block-latest-posts__post-author">
									{ sprintf(
										/* translators: byline. %s: current author. */
										__( 'by %s' ),
										currentAuthor.name
									) }
								</div>
							) }
							{ displayPostDate && post.date_gmt && (
								<time
									dateTime={ format( 'c', post.date_gmt ) }
									className="wp-block-latest-posts__post-date"
								>
									{ dateI18n( dateFormat, post.date_gmt ) }
								</time>
							) }
							{ displayPostContent &&
								displayPostContentRadio === 'excerpt' && (
									<div className="wp-block-latest-posts__post-excerpt">
										{ postExcerpt }
									</div>
								) }
							{ displayPostContent &&
								displayPostContentRadio === 'full_post' && (
									<div
										className="wp-block-latest-posts__post-full-content"
										dangerouslySetInnerHTML={ {
											__html: post.content.raw.trim(),
										} }
									/>
								) }
						</li>
					);
				} ) }
			</ul>
		</div>
	);
}
