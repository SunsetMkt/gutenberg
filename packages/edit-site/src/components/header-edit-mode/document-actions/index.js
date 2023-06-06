/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	VisuallyHidden,
	__experimentalText as Text,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { BlockIcon } from '@wordpress/block-editor';
import { store as commandsStore } from '@wordpress/commands';
import {
	chevronLeftSmall as chevronLeftSmallIcon,
	page as pageIcon,
} from '@wordpress/icons';
import { useEntityRecord } from '@wordpress/core-data';
import { displayShortcut } from '@wordpress/keycodes';
import { useState, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useEditedEntityRecord from '../../use-edited-entity-record';
import { store as editSiteStore } from '../../../store';

export default function DocumentActions() {
	const isPage = useSelect( ( select ) => select( editSiteStore ).isPage() );
	return isPage ? <PageDocumentActions /> : <TemplateDocumentActions />;
}

function PageDocumentActions() {
	const { hasPageContentLock, context } = useSelect(
		( select ) => ( {
			hasPageContentLock: select( editSiteStore ).hasPageContentLock(),
			context: select( editSiteStore ).getEditedPostContext(),
		} ),
		[]
	);

	const { hasResolved, editedRecord } = useEntityRecord(
		'postType',
		context.postType,
		context.postId
	);

	const { setHasPageContentLock } = useDispatch( editSiteStore );

	const [ hasEditedTemplate, setHasEditedTemplate ] = useState( false );
	const prevHasPageContentLock = useRef( false );
	useEffect( () => {
		if ( prevHasPageContentLock.current && ! hasPageContentLock ) {
			setHasEditedTemplate( true );
		}
		prevHasPageContentLock.current = hasPageContentLock;
	}, [ hasPageContentLock ] );

	if ( ! hasResolved ) {
		return null;
	}

	if ( ! editedRecord ) {
		return (
			<div className="edit-site-document-actions">
				{ __( 'Document not found' ) }
			</div>
		);
	}

	return hasPageContentLock ? (
		<BaseDocumentActions
			className={ classnames( 'is-page', {
				'is-animated': hasEditedTemplate,
			} ) }
			icon={ pageIcon }
		>
			{ editedRecord.title }
		</BaseDocumentActions>
	) : (
		<TemplateDocumentActions
			className="is-animated"
			onBack={ () => setHasPageContentLock( true ) }
		/>
	);
}

function TemplateDocumentActions( { className, onBack } ) {
	const { isLoaded, record, getTitle, icon } = useEditedEntityRecord();

	if ( ! isLoaded ) {
		return null;
	}

	if ( ! record ) {
		return (
			<div className="edit-site-document-actions">
				{ __( 'Document not found' ) }
			</div>
		);
	}

	const entityLabel =
		record.type === 'wp_template_part'
			? __( 'template part' )
			: __( 'template' );

	return (
		<BaseDocumentActions
			className={ className }
			icon={ icon }
			onBack={ onBack }
		>
			<VisuallyHidden as="span">
				{ sprintf(
					/* translators: %s: the entity being edited, like "template"*/
					__( 'Editing %s: ' ),
					entityLabel
				) }
			</VisuallyHidden>
			{ getTitle() }
		</BaseDocumentActions>
	);
}

function BaseDocumentActions( { className, icon, children, onBack } ) {
	const { open: openCommandCenter } = useDispatch( commandsStore );
	return (
		<div
			className={ classnames( 'edit-site-document-actions', className ) }
		>
			{ onBack && (
				<Button
					className="edit-site-document-actions__back"
					icon={ chevronLeftSmallIcon }
					onClick={ ( event ) => {
						event.stopPropagation();
						onBack();
					} }
				>
					{ __( 'Back' ) }
				</Button>
			) }
			<Button
				className="edit-site-document-actions__command"
				onClick={ () => openCommandCenter() }
			>
				<HStack
					className="edit-site-document-actions__title"
					spacing={ 1 }
					justify="center"
				>
					<BlockIcon icon={ icon } />
					<Text size="body" as="h1">
						{ children }
					</Text>
				</HStack>
				<span className="edit-site-document-actions__shortcut">
					{ displayShortcut.primary( 'k' ) }
				</span>
			</Button>
		</div>
	);
}
