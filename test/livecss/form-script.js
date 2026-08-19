(function () {
	const FORM_SELECTOR = '.form-all';
	const ITEM_SELECTOR = '.form-radio-item, .form-checkbox-item';
	const MULTIPLE_COLUMN_SELECTOR = '.form-multiple-column';
	const MEASURING_CLASS = 'measuring-choices';
	const COMPACT_LAYOUT_QUERY = '(max-width: 768px)';
	const DATE_PART_SELECTOR = '.date-fields input[maxlength]';

	let choiceMetricsCache = new WeakMap();
	const OTHER_INPUT_SELECTOR = '.form-radio-other-input, .form-checkbox-other-input, #input_partial';
	const SPINNER_SELECTOR = 'input[data-type="input-number"], input[data-type="input-spinner"], .form-spinner-input';
	const CREDIT_CARD_SELECTOR = 'input[autocomplete="cc-number"], input[autocomplete="cc-csc"]';
	const IGNORE_CLICK_SELECTOR = 'select, textarea, button, a, [role="button"]';
	const SKIP_SELECTOR = '.ct-container, #footer-links';

	const onReady = (callback) => {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', callback, { once: true });
			return;
		}

		callback();
	};

	onReady(() => {
		if (window.__formInteractionsInitialized) return;
		if (!hasPrimaryFormColor()) return;

		window.__formInteractionsInitialized = true;
		window.setTimeout(initInteractions, 0);
	});

	function hasPrimaryFormColor() {
		if (!document.body) return false;
		return getComputedStyle(document.body).getPropertyValue('--primary-form-color').trim() !== '';
	}

	function initInteractions() {
		if (document.querySelector(SKIP_SELECTOR)) return;

		const form = document.querySelector(FORM_SELECTOR);
		if (!form) return;

		markEmptyChoiceLabels(form);
		syncActiveState(form);
		enhanceCreditCardInputs(form);
		enhanceSpinners(form);
		equalizeChoiceColumns(form);

		form.addEventListener('change', () => {
			syncActiveState(form);
		});

		// Month/day/year each carry a maxlength, so a filled segment is the cue to move on
		// instead of making the user click the next box.
		form.addEventListener('input', (event) => {
			if (!(event.target instanceof HTMLInputElement)) return;
			if (!event.target.matches(DATE_PART_SELECTOR)) return;

			advanceFromDatePart(event.target);
		});

		form.addEventListener('click', (event) => {
			if (!(event.target instanceof Element)) return;

			const item = event.target.closest(ITEM_SELECTOR);
			if (!item || !form.contains(item)) return;
			if (event.target.closest(IGNORE_CLICK_SELECTOR)) return;

			// Labels and inputs toggle themselves; only proxy clicks on the card.
			if (event.target.closest('label, input')) return;

			const input = getChoiceInput(item);
			if (!input) return;

			input.click();
		});

		form.addEventListener('focusin', (event) => {
			if (!(event.target instanceof Element)) return;
			if (!event.target.matches(OTHER_INPUT_SELECTOR)) return;

			const item = event.target.closest(ITEM_SELECTOR);
			if (!item) return;

			const otherField = getOtherField(item);
			if (!otherField) return;

			ensureOtherFieldIsActive(otherField);
		});

		// Remeasuring costs ~20ms, so only the fields whose own markup changed lose their
		// cached widths; everything else replays from cache. Work is coalesced into one
		// frame so a burst of conditional-logic mutations still does a single pass.
		let pendingFrame = null;
		const staleColumns = new Set();

		const observer = new MutationObserver((mutations) => {
			let relevant = false;

			mutations.forEach((mutation) => {
				if (mutation.type !== 'childList') return;
				if (!containsRealNodes(mutation.addedNodes) && !containsRealNodes(mutation.removedNodes)) return;

				relevant = true;

				const column = mutation.target instanceof Element ? mutation.target.closest(MULTIPLE_COLUMN_SELECTOR) : null;
				if (column) staleColumns.add(column);
			});

			if (!relevant || pendingFrame) return;

			pendingFrame = window.requestAnimationFrame(() => {
				pendingFrame = null;

				staleColumns.forEach((column) => choiceMetricsCache.delete(column));
				staleColumns.clear();

				markEmptyChoiceLabels(form);
				enhanceSpinners(form);
				syncActiveState(form);
				equalizeChoiceColumns(form);
			});
		});

		observer.observe(form, {
			childList: true,
			subtree: true
		});

		// Webfonts land after init and change text metrics, so measure again once they do.
		if (document.fonts) {
			document.fonts.ready.then(() => {
				remeasureChoiceColumns(form);
			});
		}

		// Only a breakpoint changes intrinsic widths; a plain resize reuses the cache.
		window.matchMedia(COMPACT_LAYOUT_QUERY).addEventListener('change', () => {
			remeasureChoiceColumns(form);
		});

		let resizeTimer = null;

		window.addEventListener('resize', () => {
			if (resizeTimer) window.clearTimeout(resizeTimer);

			resizeTimer = window.setTimeout(() => {
				equalizeChoiceColumns(form);
			}, 120);
		});
	}

	function remeasureChoiceColumns(root) {
		choiceMetricsCache = new WeakMap();
		equalizeChoiceColumns(root);
	}

	function markEmptyChoiceLabels(root) {
		root.querySelectorAll('.form-line').forEach((line) => {
			const label = line.querySelector(':scope > .form-label-top, :scope > .form-label-left, :scope > .form-label-right');
			const choiceItems = line.querySelectorAll(ITEM_SELECTOR);
			const hasRequiredChoice = Array.from(line.querySelectorAll('input[type="radio"], input[type="checkbox"]')).some((input) => {
				return input.required || String(input.className).includes('validate[required]');
			});

			if (!label || choiceItems.length !== 1 || !hasRequiredChoice) {
				line.classList.remove('field-no-label');
				return;
			}

			const labelClone = label.cloneNode(true);

			labelClone.querySelectorAll('.form-required, .label-message').forEach((node) => {
				node.remove();
			});

			line.classList.toggle('field-no-label', labelClone.textContent.trim() === '');
		});
	}

	function syncActiveState(root) {
		root.querySelectorAll(ITEM_SELECTOR).forEach((item) => {
			const input = getChoiceInput(item);

			item.classList.toggle('active-option', Boolean(input && input.checked));
			item.classList.toggle('active', Boolean(input && input.checked));
		});
	}

	function getChoiceInput(item) {
		return item.querySelector('.form-radio-other, .form-checkbox-other, #other_partial, input[type="radio"], input[type="checkbox"]');
	}

	function getOtherField(item) {
		const input = item.querySelector(OTHER_INPUT_SELECTOR);
		if (!input) return null;

		const control =
			item.querySelector('.form-radio-other, .form-checkbox-other, #other_partial') ||
			item.querySelector('input[type="radio"], input[type="checkbox"]');

		if (!control) return null;

		return { input, control };
	}

	function ensureOtherFieldIsActive(otherField) {
		if (otherField.control.checked) return;

		otherField.control.click();
	}

	// Reads for every column happen before any write, so a resize costs one style pass
	// rather than one per field.
	function equalizeChoiceColumns(root) {
		const columns = Array.from(root.querySelectorAll(MULTIPLE_COLUMN_SELECTOR));

		primeChoiceMetrics(columns);

		const layouts = columns.map(chooseChoiceBasis);

		columns.forEach((column, index) => {
			applyChoiceBasis(column, layouts[index]);
		});
	}

	// Measuring is by far the most expensive thing here, so every probe is attached before
	// any of them is read: one layout pass for the batch instead of one per field.
	function primeChoiceMetrics(columns) {
		const pending = columns.filter((column) => !choiceMetricsCache.has(column));
		if (!pending.length) return;

		const probes = pending.map(createMeasurementProbe);

		pending.forEach((column, index) => {
			const metrics = readItemWidths(probes[index]);

			metrics.gap = parseFloat(getComputedStyle(column).columnGap) || 0;
			choiceMetricsCache.set(column, metrics);
		});

		probes.forEach((probe) => probe.remove());
	}

	function chooseChoiceBasis(column) {
		const metrics = getChoiceMetrics(column);
		if (metrics.widths.length < 2) return { basis: '', otherInline: false };

		const available = column.getBoundingClientRect().width;
		const gap = metrics.gap;
		const widest = Math.min(Math.max.apply(null, metrics.widths), available);

		// Never ask for more columns than there are options, or three options in a wide
		// row end up huddled at one end at a fraction of the width they could take.
		const fits = Math.max(1, Math.floor((available + gap) / (widest + gap)));
		const columns = Math.min(metrics.widths.length, fits);

		// Uniform widths are worth one extra row, but no more: a bigger penalty than that
		// means the widest option is an outlier and matching it would waste the row.
		// Without a grid there is no way to know how much room is left on the last row, so
		// the other-field keeps its own row rather than risk being squeezed.
		if (Math.ceil(metrics.widths.length / columns) > countNaturalRows(metrics.widths, available, gap) + 1) {
			return { basis: '', otherInline: false };
		}

		const columnWidth = (available - ((columns - 1) * gap)) / columns;
		const used = metrics.widths.length % columns;
		const freeSlots = used === 0 ? 0 : columns - used;

		// Inline only when the slots the options leave empty are wide enough to type in;
		// otherwise the field spans its own row.
		const roomBeside = (freeSlots * columnWidth) + ((freeSlots - 1) * gap);

		return {
			basis: 'calc((100% - ' + ((columns - 1) * gap) + 'px) / ' + columns + ')',
			otherInline: metrics.other > 0 && freeSlots > 0 && roomBeside >= metrics.other - 0.5
		};
	}

	function applyChoiceBasis(column, layout) {
		column.classList.toggle('choices-other-inline', layout.otherInline);

		if (column.style.getPropertyValue('--choice-basis') === layout.basis) return;

		if (!layout.basis) {
			column.classList.remove('choices-equalized');
			column.style.removeProperty('--choice-basis');
			return;
		}

		column.style.setProperty('--choice-basis', layout.basis);
		column.classList.add('choices-equalized');
	}

	// Intrinsic widths don't depend on the container, so they survive a resize; only new
	// markup, a font swap or a breakpoint can change them.
	function getChoiceMetrics(column) {
		return choiceMetricsCache.get(column) || { widths: [], gap: 0 };
	}

	// Measured on a hidden clone: toggling a class on the live column and reading widths in
	// the same task can return the pre-recalc (already grown) widths instead. The clone
	// keeps overflow hidden so items may exceed it without adding scrollable overflow.
	function createMeasurementProbe(column) {
		const probe = column.cloneNode(true);

		// Strip whatever layout the last pass decided, or the probe measures that instead
		// of the intrinsic widths. cssText below drops the inline --choice-basis with it.
		probe.classList.remove('choices-equalized', 'choices-other-inline');
		probe.classList.add(MEASURING_CLASS);
		probe.style.cssText = 'position:absolute;top:0;left:0;width:' + column.getBoundingClientRect().width + 'px;overflow:hidden;visibility:hidden;pointer-events:none';
		column.parentNode.appendChild(probe);

		return probe;
	}

	// The other-field is kept apart from the options: it never gets a say in how many
	// columns there are, it only asks whether it fits in one of them.
	function readItemWidths(probe) {
		const widths = [];
		let other = 0;

		probe.querySelectorAll(ITEM_SELECTOR).forEach((item) => {
			const width = item.getBoundingClientRect().width;

			if (item.querySelector(OTHER_INPUT_SELECTOR)) {
				other = Math.max(other, width);
				return;
			}

			widths.push(width);
		});

		return { widths: widths, other: other };
	}

	function containsRealNodes(nodes) {
		return Array.from(nodes).some((node) => {
			return !(node instanceof Element) || !node.classList.contains(MEASURING_CLASS);
		});
	}

	function countNaturalRows(widths, available, gap) {
		let rows = 1;
		let used = 0;

		widths.forEach((width) => {
			const needed = used ? gap + width : width;

			if (used && used + needed > available + 0.5) {
				rows++;
				used = width;
				return;
			}

			used += needed;
		});

		return rows;
	}

	function enhanceSpinners(root) {
		root.querySelectorAll(SPINNER_SELECTOR).forEach((input) => {
			if (!(input instanceof HTMLInputElement)) return;
			if (input.closest('.custom-number-wrapper')) return;

			const wrapper = document.createElement('div');
			wrapper.className = 'custom-number-wrapper';

			const minusButton = createSpinnerButton('minus', '-', 'Decrease value');
			const plusButton = createSpinnerButton('plus', '+', 'Increase value');

			input.parentNode.insertBefore(wrapper, input);
			wrapper.append(minusButton, input, plusButton);

			minusButton.addEventListener('click', () => stepSpinner(input, -1));
			plusButton.addEventListener('click', () => stepSpinner(input, 1));
		});
	}

	function createSpinnerButton(className, label, ariaLabel) {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'qty-btn ' + className;
		button.textContent = label;
		button.setAttribute('aria-label', ariaLabel);
		return button;
	}

	function advanceFromDatePart(input) {
		const maxLength = Number(input.getAttribute('maxlength'));
		if (!maxLength || input.value.length < maxLength) return;

		// Only when the caret sits at the end, so editing an earlier digit stays put.
		if (typeof input.selectionStart === 'number' && input.selectionStart < input.value.length) return;

		const group = input.closest('.date-fields');
		if (!group) return;

		const parts = Array.from(group.querySelectorAll(DATE_PART_SELECTOR));
		const next = parts[parts.indexOf(input) + 1];
		if (!next) return;

		next.focus({ preventScroll: true });

		if (typeof next.select === 'function') {
			next.select();
		}
	}

	function enhanceCreditCardInputs(root) {
		root.querySelectorAll(CREDIT_CARD_SELECTOR).forEach((input) => {
			if (!(input instanceof HTMLInputElement)) return;

			input.setAttribute('inputmode', 'numeric');
		});
	}

	function stepSpinner(input, direction) {
		if (input.disabled || input.readOnly) return;

		setSpinnerValue(input, direction, getSpinnerConfig(input));

		input.dispatchEvent(new Event('input', { bubbles: true }));
		input.dispatchEvent(new Event('change', { bubbles: true }));

		if (typeof input.validateSpinnerInputs === 'function') {
			input.validateSpinnerInputs();
		}

		input.focus({ preventScroll: true });
	}

	function setSpinnerValue(input, direction, config) {
		const currentValue = Number(input.value);
		const baseValue = Number.isFinite(currentValue) ? currentValue : 0;
		const nextValue = Math.min(config.max, Math.max(config.min, baseValue + (config.step * direction)));

		input.value = String(nextValue);
	}

	function getSpinnerConfig(input) {
		const formJson = window.formJson || {};
		const fieldId = input.id.split('_')[1];
		const step = getPositiveNumber(formJson[fieldId + '_addAmount']) || 1;
		const min = getNumber(formJson[fieldId + '_minValue']);
		const max = getNumber(formJson[fieldId + '_maxValue']);

		return {
			step,
			min: min ?? (formJson[fieldId + '_allowMinus'] === 'Yes' ? -Infinity : 0),
			max: max ?? Infinity
		};
	}

	function getNumber(value) {
		if (value === undefined || value === null || value === '') return null;

		const number = Number(value);
		return Number.isFinite(number) ? number : null;
	}

	function getPositiveNumber(value) {
		const number = getNumber(value);
		return number > 0 ? number : null;
	}
})();
