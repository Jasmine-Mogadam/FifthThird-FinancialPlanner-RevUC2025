
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function select_option(select, value, mounting) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        if (!mounting || value !== undefined) {
            select.selectedIndex = -1; // no option should be selected
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked');
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\Dropdown.svelte generated by Svelte v3.59.2 */

    const file$7 = "src\\components\\Dropdown.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (15:2) {#each options as option}
    function create_each_block$3(ctx) {
    	let option;
    	let t_value = /*option*/ ctx[4] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*option*/ ctx[4];
    			option.value = option.__value;
    			add_location(option, file$7, 15, 4, 351);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*options*/ 2 && t_value !== (t_value = /*option*/ ctx[4] + "")) set_data_dev(t, t_value);

    			if (dirty & /*options*/ 2 && option_value_value !== (option_value_value = /*option*/ ctx[4])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(15:2) {#each options as option}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let select;
    	let mounted;
    	let dispose;
    	let each_value = /*options*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(select, "class", "svelte-i6xezc");
    			if (/*selected*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[3].call(select));
    			add_location(select, file$7, 13, 0, 263);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(select, null);
    				}
    			}

    			select_option(select, /*selected*/ ctx[0], true);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*handleChange*/ ctx[2], false, false, false, false),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[3])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*options*/ 2) {
    				each_value = /*options*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*selected, options*/ 3) {
    				select_option(select, /*selected*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Dropdown', slots, []);
    	let { options = [] } = $$props;
    	let { selected = '' } = $$props;

    	function handleChange(event) {
    		$$invalidate(0, selected = event.target.value);
    		const changeEvent = new CustomEvent('change', { detail: selected });
    		dispatchEvent(changeEvent);
    	}

    	const writable_props = ['options', 'selected'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Dropdown> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		selected = select_value(this);
    		$$invalidate(0, selected);
    		$$invalidate(1, options);
    	}

    	$$self.$$set = $$props => {
    		if ('options' in $$props) $$invalidate(1, options = $$props.options);
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	$$self.$capture_state = () => ({ options, selected, handleChange });

    	$$self.$inject_state = $$props => {
    		if ('options' in $$props) $$invalidate(1, options = $$props.options);
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selected, options, handleChange, select_change_handler];
    }

    class Dropdown extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { options: 1, selected: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dropdown",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get options() {
    		throw new Error("<Dropdown>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<Dropdown>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Dropdown>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Dropdown>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\Overview.svelte generated by Svelte v3.59.2 */
    const file$6 = "src\\pages\\Overview.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let dropdown;
    	let updating_value;
    	let t2;
    	let div0;
    	let p0;
    	let t5;
    	let p1;
    	let t8;
    	let p2;
    	let t11;
    	let p3;
    	let t12;
    	let t13;
    	let t14;
    	let t15;
    	let current;

    	function dropdown_value_binding(value) {
    		/*dropdown_value_binding*/ ctx[7](value);
    	}

    	let dropdown_props = { timeUnits: /*timeUnits*/ ctx[5] };

    	if (/*timeUnit*/ ctx[0] !== void 0) {
    		dropdown_props.value = /*timeUnit*/ ctx[0];
    	}

    	dropdown = new Dropdown({ props: dropdown_props, $$inline: true });
    	binding_callbacks.push(() => bind(dropdown, 'value', dropdown_value_binding));
    	dropdown.$on("change", /*handleTimeUnitChange*/ ctx[6]);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Overview";
    			t1 = space();
    			create_component(dropdown.$$.fragment);
    			t2 = space();
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = `Current Income: \$${/*currentIncome*/ ctx[2]}`;
    			t5 = space();
    			p1 = element("p");
    			p1.textContent = `Savings Goal: \$${/*savingsGoal*/ ctx[3]}`;
    			t8 = space();
    			p2 = element("p");
    			p2.textContent = `Total Amount in Bank: \$${/*totalBankAmount*/ ctx[4]}`;
    			t11 = space();
    			p3 = element("p");
    			t12 = text("Average Income per ");
    			t13 = text(/*timeUnit*/ ctx[0]);
    			t14 = text(": $");
    			t15 = text(/*averageIncome*/ ctx[1]);
    			add_location(h1, file$6, 34, 2, 907);
    			add_location(p0, file$6, 38, 4, 1036);
    			add_location(p1, file$6, 39, 4, 1080);
    			add_location(p2, file$6, 40, 4, 1120);
    			add_location(p3, file$6, 41, 4, 1172);
    			attr_dev(div0, "class", "summary svelte-3qgz2b");
    			add_location(div0, file$6, 37, 2, 1010);
    			attr_dev(div1, "class", "overview svelte-3qgz2b");
    			add_location(div1, file$6, 33, 0, 882);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			mount_component(dropdown, div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t5);
    			append_dev(div0, p1);
    			append_dev(div0, t8);
    			append_dev(div0, p2);
    			append_dev(div0, t11);
    			append_dev(div0, p3);
    			append_dev(p3, t12);
    			append_dev(p3, t13);
    			append_dev(p3, t14);
    			append_dev(p3, t15);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const dropdown_changes = {};

    			if (!updating_value && dirty & /*timeUnit*/ 1) {
    				updating_value = true;
    				dropdown_changes.value = /*timeUnit*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			dropdown.$set(dropdown_changes);
    			if (!current || dirty & /*timeUnit*/ 1) set_data_dev(t13, /*timeUnit*/ ctx[0]);
    			if (!current || dirty & /*averageIncome*/ 2) set_data_dev(t15, /*averageIncome*/ ctx[1]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dropdown.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dropdown.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(dropdown);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Overview', slots, []);
    	let currentIncome = 5000; // Example current income
    	let savingsGoal = 20000; // Example savings goal
    	let totalBankAmount = 15000; // Example total amount in bank
    	let timeUnit = 'Monthly'; // Default time unit
    	const timeUnits = ['Monthly', 'Weekly'];
    	let averageIncome = 0;

    	onMount(() => {
    		// Calculate average income based on the current income and time unit
    		$$invalidate(1, averageIncome = timeUnit === 'Monthly'
    		? currentIncome
    		: currentIncome / 4); // Simplified for example
    	});

    	function handleTimeUnitChange(event) {
    		$$invalidate(0, timeUnit = event.detail);

    		$$invalidate(1, averageIncome = timeUnit === 'Monthly'
    		? currentIncome
    		: currentIncome / 4); // Update average income
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Overview> was created with unknown prop '${key}'`);
    	});

    	function dropdown_value_binding(value) {
    		timeUnit = value;
    		$$invalidate(0, timeUnit);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Dropdown,
    		currentIncome,
    		savingsGoal,
    		totalBankAmount,
    		timeUnit,
    		timeUnits,
    		averageIncome,
    		handleTimeUnitChange
    	});

    	$$self.$inject_state = $$props => {
    		if ('currentIncome' in $$props) $$invalidate(2, currentIncome = $$props.currentIncome);
    		if ('savingsGoal' in $$props) $$invalidate(3, savingsGoal = $$props.savingsGoal);
    		if ('totalBankAmount' in $$props) $$invalidate(4, totalBankAmount = $$props.totalBankAmount);
    		if ('timeUnit' in $$props) $$invalidate(0, timeUnit = $$props.timeUnit);
    		if ('averageIncome' in $$props) $$invalidate(1, averageIncome = $$props.averageIncome);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		timeUnit,
    		averageIncome,
    		currentIncome,
    		savingsGoal,
    		totalBankAmount,
    		timeUnits,
    		handleTimeUnitChange,
    		dropdown_value_binding
    	];
    }

    class Overview extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Overview",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\components\PaymentDetails.svelte generated by Svelte v3.59.2 */

    const file$5 = "src\\components\\PaymentDetails.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (47:6) {#each paymentDetails as payment}
    function create_each_block$2(ctx) {
    	let tr;
    	let td0;
    	let t0_value = formatDate(/*payment*/ ctx[2].date) + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2;
    	let t3_value = /*payment*/ ctx[2].amount + "";
    	let t3;
    	let t4;
    	let td2;
    	let t5_value = /*payment*/ ctx[2].payee + "";
    	let t5;
    	let t6;
    	let td3;
    	let t7_value = /*payment*/ ctx[2].type + "";
    	let t7;
    	let t8;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text("$");
    			t3 = text(t3_value);
    			t4 = space();
    			td2 = element("td");
    			t5 = text(t5_value);
    			t6 = space();
    			td3 = element("td");
    			t7 = text(t7_value);
    			t8 = space();
    			attr_dev(td0, "class", "svelte-kunhcq");
    			add_location(td0, file$5, 48, 10, 941);
    			attr_dev(td1, "class", "svelte-kunhcq");
    			add_location(td1, file$5, 49, 10, 987);
    			attr_dev(td2, "class", "svelte-kunhcq");
    			add_location(td2, file$5, 50, 10, 1024);
    			attr_dev(td3, "class", "svelte-kunhcq");
    			add_location(td3, file$5, 51, 10, 1059);
    			add_location(tr, file$5, 47, 8, 926);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(td1, t3);
    			append_dev(tr, t4);
    			append_dev(tr, td2);
    			append_dev(td2, t5);
    			append_dev(tr, t6);
    			append_dev(tr, td3);
    			append_dev(td3, t7);
    			append_dev(tr, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*paymentDetails*/ 1 && t0_value !== (t0_value = formatDate(/*payment*/ ctx[2].date) + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*paymentDetails*/ 1 && t3_value !== (t3_value = /*payment*/ ctx[2].amount + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*paymentDetails*/ 1 && t5_value !== (t5_value = /*payment*/ ctx[2].payee + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*paymentDetails*/ 1 && t7_value !== (t7_value = /*payment*/ ctx[2].type + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(47:6) {#each paymentDetails as payment}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let p;
    	let t2;
    	let t3;
    	let t4;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t6;
    	let th1;
    	let t8;
    	let th2;
    	let t10;
    	let th3;
    	let t12;
    	let tbody;
    	let each_value = /*paymentDetails*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Payment Details";
    			t1 = space();
    			p = element("p");
    			t2 = text("Total Amount: $");
    			t3 = text(/*totalAmount*/ ctx[1]);
    			t4 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Date";
    			t6 = space();
    			th1 = element("th");
    			th1.textContent = "Amount";
    			t8 = space();
    			th2 = element("th");
    			th2.textContent = "Payee";
    			t10 = space();
    			th3 = element("th");
    			th3.textContent = "Type";
    			t12 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h2, "class", "svelte-kunhcq");
    			add_location(h2, file$5, 34, 2, 654);
    			add_location(p, file$5, 35, 2, 681);
    			attr_dev(th0, "class", "svelte-kunhcq");
    			add_location(th0, file$5, 39, 8, 758);
    			attr_dev(th1, "class", "svelte-kunhcq");
    			add_location(th1, file$5, 40, 8, 780);
    			attr_dev(th2, "class", "svelte-kunhcq");
    			add_location(th2, file$5, 41, 8, 804);
    			attr_dev(th3, "class", "svelte-kunhcq");
    			add_location(th3, file$5, 42, 8, 827);
    			add_location(tr, file$5, 38, 6, 745);
    			add_location(thead, file$5, 37, 4, 731);
    			add_location(tbody, file$5, 45, 4, 870);
    			attr_dev(table, "class", "svelte-kunhcq");
    			add_location(table, file$5, 36, 2, 719);
    			attr_dev(div, "class", "payment-details svelte-kunhcq");
    			add_location(div, file$5, 33, 0, 622);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(div, t4);
    			append_dev(div, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t6);
    			append_dev(tr, th1);
    			append_dev(tr, t8);
    			append_dev(tr, th2);
    			append_dev(tr, t10);
    			append_dev(tr, th3);
    			append_dev(table, t12);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(tbody, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*totalAmount*/ 2) set_data_dev(t3, /*totalAmount*/ ctx[1]);

    			if (dirty & /*paymentDetails, formatDate*/ 1) {
    				each_value = /*paymentDetails*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function formatDate(date) {
    	return new Date(date).toLocaleDateString();
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PaymentDetails', slots, []);
    	let { paymentDetails = [] } = $$props;
    	let { totalAmount = 0 } = $$props;
    	const writable_props = ['paymentDetails', 'totalAmount'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PaymentDetails> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('paymentDetails' in $$props) $$invalidate(0, paymentDetails = $$props.paymentDetails);
    		if ('totalAmount' in $$props) $$invalidate(1, totalAmount = $$props.totalAmount);
    	};

    	$$self.$capture_state = () => ({ paymentDetails, totalAmount, formatDate });

    	$$self.$inject_state = $$props => {
    		if ('paymentDetails' in $$props) $$invalidate(0, paymentDetails = $$props.paymentDetails);
    		if ('totalAmount' in $$props) $$invalidate(1, totalAmount = $$props.totalAmount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [paymentDetails, totalAmount];
    }

    class PaymentDetails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { paymentDetails: 0, totalAmount: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PaymentDetails",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get paymentDetails() {
    		throw new Error("<PaymentDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set paymentDetails(value) {
    		throw new Error("<PaymentDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get totalAmount() {
    		throw new Error("<PaymentDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set totalAmount(value) {
    		throw new Error("<PaymentDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\FinancialTable.svelte generated by Svelte v3.59.2 */
    const file$4 = "src\\components\\FinancialTable.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (58:4) {#each financialData as row}
    function create_each_block$1(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*row*/ ctx[12].date + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*row*/ ctx[12].entertainment + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*row*/ ctx[12].rent + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*row*/ ctx[12].groceries + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = /*row*/ ctx[12].other + "";
    	let t8;
    	let t9;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*row*/ ctx[12]);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[8](/*row*/ ctx[12]);
    	}

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[9](/*row*/ ctx[12]);
    	}

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[10](/*row*/ ctx[12]);
    	}

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[11](/*row*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			attr_dev(td0, "class", "svelte-jkpmaw");
    			add_location(td0, file$4, 59, 8, 1147);
    			attr_dev(td1, "class", "svelte-jkpmaw");
    			add_location(td1, file$4, 60, 8, 1175);
    			attr_dev(td2, "class", "svelte-jkpmaw");
    			add_location(td2, file$4, 61, 8, 1264);
    			attr_dev(td3, "class", "svelte-jkpmaw");
    			add_location(td3, file$4, 62, 8, 1335);
    			attr_dev(td4, "class", "svelte-jkpmaw");
    			add_location(td4, file$4, 63, 8, 1416);
    			attr_dev(tr, "class", "svelte-jkpmaw");
    			add_location(tr, file$4, 58, 6, 1097);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, t8);
    			append_dev(tr, t9);

    			if (!mounted) {
    				dispose = [
    					listen_dev(td1, "click", click_handler, false, false, false, false),
    					listen_dev(td2, "click", click_handler_1, false, false, false, false),
    					listen_dev(td3, "click", click_handler_2, false, false, false, false),
    					listen_dev(td4, "click", click_handler_3, false, false, false, false),
    					listen_dev(tr, "click", click_handler_4, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*financialData*/ 2 && t0_value !== (t0_value = /*row*/ ctx[12].date + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*financialData*/ 2 && t2_value !== (t2_value = /*row*/ ctx[12].entertainment + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*financialData*/ 2 && t4_value !== (t4_value = /*row*/ ctx[12].rent + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*financialData*/ 2 && t6_value !== (t6_value = /*row*/ ctx[12].groceries + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*financialData*/ 2 && t8_value !== (t8_value = /*row*/ ctx[12].other + "")) set_data_dev(t8, t8_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(58:4) {#each financialData as row}",
    		ctx
    	});

    	return block;
    }

    // (70:0) {#if selectedPayment}
    function create_if_block_1$1(ctx) {
    	let paymentdetails;
    	let current;

    	paymentdetails = new PaymentDetails({
    			props: {
    				selectedPayment: /*selectedPayment*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(paymentdetails.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(paymentdetails, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const paymentdetails_changes = {};
    			if (dirty & /*selectedPayment*/ 4) paymentdetails_changes.selectedPayment = /*selectedPayment*/ ctx[2];
    			paymentdetails.$set(paymentdetails_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(paymentdetails.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(paymentdetails.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(paymentdetails, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(70:0) {#if selectedPayment}",
    		ctx
    	});

    	return block;
    }

    // (74:0) {#if selectedRow}
    function create_if_block$2(ctx) {
    	let paymentdetails;
    	let current;

    	paymentdetails = new PaymentDetails({
    			props: { selectedRow: /*selectedRow*/ ctx[3] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(paymentdetails.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(paymentdetails, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const paymentdetails_changes = {};
    			if (dirty & /*selectedRow*/ 8) paymentdetails_changes.selectedRow = /*selectedRow*/ ctx[3];
    			paymentdetails.$set(paymentdetails_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(paymentdetails.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(paymentdetails.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(paymentdetails, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(74:0) {#if selectedRow}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let h2;
    	let t1;
    	let select;
    	let option0;
    	let option1;
    	let t4;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t5_value = (/*timeUnit*/ ctx[0] === 'weekly' ? 'Week' : 'Month') + "";
    	let t5;
    	let t6;
    	let th1;
    	let t8;
    	let th2;
    	let t10;
    	let th3;
    	let t12;
    	let th4;
    	let t14;
    	let tbody;
    	let t15;
    	let t16;
    	let if_block1_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*financialData*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	let if_block0 = /*selectedPayment*/ ctx[2] && create_if_block_1$1(ctx);
    	let if_block1 = /*selectedRow*/ ctx[3] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Financial Table";
    			t1 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Weekly";
    			option1 = element("option");
    			option1.textContent = "Monthly";
    			t4 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			t5 = text(t5_value);
    			t6 = space();
    			th1 = element("th");
    			th1.textContent = "Entertainment";
    			t8 = space();
    			th2 = element("th");
    			th2.textContent = "Rent";
    			t10 = space();
    			th3 = element("th");
    			th3.textContent = "Groceries";
    			t12 = space();
    			th4 = element("th");
    			th4.textContent = "Other";
    			t14 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t15 = space();
    			if (if_block0) if_block0.c();
    			t16 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			add_location(h2, file$4, 40, 0, 696);
    			option0.__value = "weekly";
    			option0.value = option0.__value;
    			add_location(option0, file$4, 42, 2, 754);
    			option1.__value = "monthly";
    			option1.value = option1.__value;
    			add_location(option1, file$4, 43, 2, 795);
    			if (/*timeUnit*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[6].call(select));
    			add_location(select, file$4, 41, 0, 721);
    			attr_dev(th0, "class", "svelte-jkpmaw");
    			add_location(th0, file$4, 49, 6, 880);
    			attr_dev(th1, "class", "svelte-jkpmaw");
    			add_location(th1, file$4, 50, 6, 938);
    			attr_dev(th2, "class", "svelte-jkpmaw");
    			add_location(th2, file$4, 51, 6, 967);
    			attr_dev(th3, "class", "svelte-jkpmaw");
    			add_location(th3, file$4, 52, 6, 987);
    			attr_dev(th4, "class", "svelte-jkpmaw");
    			add_location(th4, file$4, 53, 6, 1012);
    			attr_dev(tr, "class", "svelte-jkpmaw");
    			add_location(tr, file$4, 48, 4, 869);
    			add_location(thead, file$4, 47, 2, 857);
    			add_location(tbody, file$4, 56, 2, 1050);
    			attr_dev(table, "class", "svelte-jkpmaw");
    			add_location(table, file$4, 46, 0, 847);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, select, anchor);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			select_option(select, /*timeUnit*/ ctx[0], true);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(th0, t5);
    			append_dev(tr, t6);
    			append_dev(tr, th1);
    			append_dev(tr, t8);
    			append_dev(tr, th2);
    			append_dev(tr, t10);
    			append_dev(tr, th3);
    			append_dev(tr, t12);
    			append_dev(tr, th4);
    			append_dev(table, t14);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(tbody, null);
    				}
    			}

    			insert_dev(target, t15, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t16, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*select_change_handler*/ ctx[6]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*timeUnit*/ 1) {
    				select_option(select, /*timeUnit*/ ctx[0]);
    			}

    			if ((!current || dirty & /*timeUnit*/ 1) && t5_value !== (t5_value = (/*timeUnit*/ ctx[0] === 'weekly' ? 'Week' : 'Month') + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*handleRowClick, financialData, handleCellClick*/ 50) {
    				each_value = /*financialData*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*selectedPayment*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*selectedPayment*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t16.parentNode, t16);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*selectedRow*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*selectedRow*/ 8) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(select);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t15);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t16);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FinancialTable', slots, []);
    	let { financialData = [] } = $$props;
    	let { timeUnit = 'monthly' } = $$props;
    	let selectedPayment = null;
    	let selectedRow = null;

    	function handleCellClick(payment) {
    		$$invalidate(2, selectedPayment = payment);
    	}

    	function handleRowClick(row) {
    		$$invalidate(3, selectedRow = row);
    	}

    	onMount(() => {
    		
    	}); // Any initialization logic can go here

    	const writable_props = ['financialData', 'timeUnit'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FinancialTable> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		timeUnit = select_value(this);
    		$$invalidate(0, timeUnit);
    	}

    	const click_handler = row => handleCellClick(row.entertainment);
    	const click_handler_1 = row => handleCellClick(row.rent);
    	const click_handler_2 = row => handleCellClick(row.groceries);
    	const click_handler_3 = row => handleCellClick(row.other);
    	const click_handler_4 = row => handleRowClick(row);

    	$$self.$$set = $$props => {
    		if ('financialData' in $$props) $$invalidate(1, financialData = $$props.financialData);
    		if ('timeUnit' in $$props) $$invalidate(0, timeUnit = $$props.timeUnit);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		PaymentDetails,
    		financialData,
    		timeUnit,
    		selectedPayment,
    		selectedRow,
    		handleCellClick,
    		handleRowClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('financialData' in $$props) $$invalidate(1, financialData = $$props.financialData);
    		if ('timeUnit' in $$props) $$invalidate(0, timeUnit = $$props.timeUnit);
    		if ('selectedPayment' in $$props) $$invalidate(2, selectedPayment = $$props.selectedPayment);
    		if ('selectedRow' in $$props) $$invalidate(3, selectedRow = $$props.selectedRow);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		timeUnit,
    		financialData,
    		selectedPayment,
    		selectedRow,
    		handleCellClick,
    		handleRowClick,
    		select_change_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class FinancialTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { financialData: 1, timeUnit: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FinancialTable",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get financialData() {
    		throw new Error("<FinancialTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set financialData(value) {
    		throw new Error("<FinancialTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get timeUnit() {
    		throw new Error("<FinancialTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set timeUnit(value) {
    		throw new Error("<FinancialTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\Financials.svelte generated by Svelte v3.59.2 */
    const file$3 = "src\\pages\\Financials.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let dropdown;
    	let t2;
    	let financialtable;
    	let current;

    	dropdown = new Dropdown({
    			props: { timeUnit: /*timeUnit*/ ctx[0] },
    			$$inline: true
    		});

    	dropdown.$on("change", /*handleTimeUnitChange*/ ctx[2]);

    	financialtable = new FinancialTable({
    			props: {
    				financialData: /*financialData*/ ctx[1],
    				timeUnit: /*timeUnit*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Financials";
    			t1 = space();
    			create_component(dropdown.$$.fragment);
    			t2 = space();
    			create_component(financialtable.$$.fragment);
    			add_location(h1, file$3, 30, 2, 926);
    			attr_dev(main, "class", "svelte-lxoocr");
    			add_location(main, file$3, 29, 0, 917);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			mount_component(dropdown, main, null);
    			append_dev(main, t2);
    			mount_component(financialtable, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const dropdown_changes = {};
    			if (dirty & /*timeUnit*/ 1) dropdown_changes.timeUnit = /*timeUnit*/ ctx[0];
    			dropdown.$set(dropdown_changes);
    			const financialtable_changes = {};
    			if (dirty & /*financialData*/ 2) financialtable_changes.financialData = /*financialData*/ ctx[1];
    			if (dirty & /*timeUnit*/ 1) financialtable_changes.timeUnit = /*timeUnit*/ ctx[0];
    			financialtable.$set(financialtable_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dropdown.$$.fragment, local);
    			transition_in(financialtable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dropdown.$$.fragment, local);
    			transition_out(financialtable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(dropdown);
    			destroy_component(financialtable);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Financials', slots, []);
    	let timeUnit = 'monthly'; // default time unit
    	let financialData = []; // to hold financial data

    	// Function to fetch financial data based on the selected time unit
    	const fetchFinancialData = () => {
    		// Placeholder for fetching data logic
    		// This could be an API call or local data fetching
    		$$invalidate(1, financialData = [
    			{
    				date: 'January 2023',
    				entertainment: 200,
    				rent: 1200,
    				groceries: 300
    			},
    			{
    				date: 'February 2023',
    				entertainment: 150,
    				rent: 1200,
    				groceries: 250
    			}
    		]); // Add more data as needed
    	};

    	onMount(() => {
    		fetchFinancialData();
    	});

    	const handleTimeUnitChange = event => {
    		$$invalidate(0, timeUnit = event.detail);
    		fetchFinancialData(); // Re-fetch data based on the new time unit
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Financials> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		FinancialTable,
    		Dropdown,
    		onMount,
    		timeUnit,
    		financialData,
    		fetchFinancialData,
    		handleTimeUnitChange
    	});

    	$$self.$inject_state = $$props => {
    		if ('timeUnit' in $$props) $$invalidate(0, timeUnit = $$props.timeUnit);
    		if ('financialData' in $$props) $$invalidate(1, financialData = $$props.financialData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [timeUnit, financialData, handleTimeUnitChange];
    }

    class Financials extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Financials",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\SavingsPlan.svelte generated by Svelte v3.59.2 */
    const file$2 = "src\\components\\SavingsPlan.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (54:8) {#each spendingCutSuggestions as suggestion}
    function create_each_block(ctx) {
    	let li;
    	let t_value = /*suggestion*/ ctx[5] + "";
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			attr_dev(li, "class", "svelte-17tgovx");
    			add_location(li, file$2, 54, 12, 1590);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*spendingCutSuggestions*/ 2 && t_value !== (t_value = /*suggestion*/ ctx[5] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(54:8) {#each spendingCutSuggestions as suggestion}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let p0;
    	let t2;
    	let strong0;
    	let t4;
    	let p1;
    	let t5;
    	let strong1;
    	let t6;
    	let t7;
    	let h3;
    	let t9;
    	let ul;
    	let each_value = /*spendingCutSuggestions*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Savings Plan";
    			t1 = space();
    			p0 = element("p");
    			t2 = text("Your ROTH IRA goal: $");
    			strong0 = element("strong");
    			strong0.textContent = `${/*savingsGoal*/ ctx[2]}`;
    			t4 = space();
    			p1 = element("p");
    			t5 = text("Monthly savings needed: $");
    			strong1 = element("strong");
    			t6 = text(/*monthlySavings*/ ctx[0]);
    			t7 = space();
    			h3 = element("h3");
    			h3.textContent = "Spending Cut Suggestions";
    			t9 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h2, "class", "svelte-17tgovx");
    			add_location(h2, file$2, 47, 4, 1298);
    			add_location(strong0, file$2, 48, 28, 1348);
    			add_location(p0, file$2, 48, 4, 1324);
    			add_location(strong1, file$2, 49, 32, 1415);
    			add_location(p1, file$2, 49, 4, 1387);
    			add_location(h3, file$2, 51, 4, 1462);
    			attr_dev(ul, "class", "suggestions svelte-17tgovx");
    			add_location(ul, file$2, 52, 4, 1500);
    			attr_dev(div, "class", "savings-plan svelte-17tgovx");
    			add_location(div, file$2, 46, 0, 1267);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(p0, t2);
    			append_dev(p0, strong0);
    			append_dev(div, t4);
    			append_dev(div, p1);
    			append_dev(p1, t5);
    			append_dev(p1, strong1);
    			append_dev(strong1, t6);
    			append_dev(div, t7);
    			append_dev(div, h3);
    			append_dev(div, t9);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*monthlySavings*/ 1) set_data_dev(t6, /*monthlySavings*/ ctx[0]);

    			if (dirty & /*spendingCutSuggestions*/ 2) {
    				each_value = /*spendingCutSuggestions*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SavingsPlan', slots, []);
    	let savingsGoal = 4000; // Default ROTH IRA goal
    	let monthlySavings = 0;
    	let totalSavings = 0;
    	let spendingCutSuggestions = [];

    	function calculateSavingsPlan() {
    		$$invalidate(0, monthlySavings = Math.ceil(savingsGoal / 12)); // Monthly savings for ROTH IRA
    		totalSavings = 0; // Reset total savings
    		$$invalidate(1, spendingCutSuggestions = []); // Reset suggestions

    		// Example spending cut suggestions based on average spending
    		spendingCutSuggestions.push("Consider reducing entertainment spending by $50.");

    		spendingCutSuggestions.push("Try to limit dining out to once a week.");
    		spendingCutSuggestions.push("Evaluate subscriptions and cancel unused ones.");
    	}

    	onMount(() => {
    		calculateSavingsPlan();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SavingsPlan> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		savingsGoal,
    		monthlySavings,
    		totalSavings,
    		spendingCutSuggestions,
    		calculateSavingsPlan
    	});

    	$$self.$inject_state = $$props => {
    		if ('savingsGoal' in $$props) $$invalidate(2, savingsGoal = $$props.savingsGoal);
    		if ('monthlySavings' in $$props) $$invalidate(0, monthlySavings = $$props.monthlySavings);
    		if ('totalSavings' in $$props) totalSavings = $$props.totalSavings;
    		if ('spendingCutSuggestions' in $$props) $$invalidate(1, spendingCutSuggestions = $$props.spendingCutSuggestions);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [monthlySavings, spendingCutSuggestions, savingsGoal];
    }

    class SavingsPlan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SavingsPlan",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\pages\Planning.svelte generated by Svelte v3.59.2 */
    const file$1 = "src\\pages\\Planning.svelte";

    // (42:2) {#if cutSpendingReview}
    function create_if_block$1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*cutSpendingReview*/ ctx[1]);
    			attr_dev(div, "class", "review svelte-9kohmj");
    			add_location(div, file$1, 42, 4, 1096);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cutSpendingReview*/ 2) set_data_dev(t, /*cutSpendingReview*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(42:2) {#if cutSpendingReview}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let savingsplan;
    	let updating_currentSavings;
    	let t2;
    	let button;
    	let t4;
    	let t5;
    	let h2;
    	let current;
    	let mounted;
    	let dispose;

    	function savingsplan_currentSavings_binding(value) {
    		/*savingsplan_currentSavings_binding*/ ctx[5](value);
    	}

    	let savingsplan_props = { goal: /*goal*/ ctx[2] };

    	if (/*currentSavings*/ ctx[0] !== void 0) {
    		savingsplan_props.currentSavings = /*currentSavings*/ ctx[0];
    	}

    	savingsplan = new SavingsPlan({ props: savingsplan_props, $$inline: true });
    	binding_callbacks.push(() => bind(savingsplan, 'currentSavings', savingsplan_currentSavings_binding));
    	let if_block = /*cutSpendingReview*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Financial Planning";
    			t1 = space();
    			create_component(savingsplan.$$.fragment);
    			t2 = space();
    			button = element("button");
    			button.textContent = "Cut Spending";
    			t4 = space();
    			if (if_block) if_block.c();
    			t5 = space();
    			h2 = element("h2");
    			h2.textContent = `Suggested Monthly Contribution: \$${/*calculateSavingsPlan*/ ctx[3]()}`;
    			add_location(h1, file$1, 35, 2, 928);
    			add_location(button, file$1, 39, 2, 1007);
    			add_location(h2, file$1, 45, 2, 1153);
    			attr_dev(div, "class", "planning-container svelte-9kohmj");
    			add_location(div, file$1, 34, 0, 893);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			mount_component(savingsplan, div, null);
    			append_dev(div, t2);
    			append_dev(div, button);
    			append_dev(div, t4);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t5);
    			append_dev(div, h2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*reviewSpending*/ ctx[4], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const savingsplan_changes = {};

    			if (!updating_currentSavings && dirty & /*currentSavings*/ 1) {
    				updating_currentSavings = true;
    				savingsplan_changes.currentSavings = /*currentSavings*/ ctx[0];
    				add_flush_callback(() => updating_currentSavings = false);
    			}

    			savingsplan.$set(savingsplan_changes);

    			if (/*cutSpendingReview*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div, t5);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(savingsplan.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(savingsplan.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(savingsplan);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Planning', slots, []);
    	let goal = 4000; // Default goal for ROTH IRA
    	let currentSavings = 0; // Current savings amount
    	let cutSpendingReview = '';

    	function calculateSavingsPlan() {
    		// Logic to calculate savings plan based on current savings and goal
    		const monthlyContribution = (goal - currentSavings) / 12;

    		return monthlyContribution > 0 ? monthlyContribution : 0;
    	}

    	function reviewSpending() {
    		// Logic to review spending habits
    		$$invalidate(1, cutSpendingReview = `You spent $100 on groceries this month, that's 30% less than the average $300, and 3% less than last month.`);
    	}

    	onMount(() => {
    		
    	}); // Any initialization logic can go here

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Planning> was created with unknown prop '${key}'`);
    	});

    	function savingsplan_currentSavings_binding(value) {
    		currentSavings = value;
    		$$invalidate(0, currentSavings);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		SavingsPlan,
    		goal,
    		currentSavings,
    		cutSpendingReview,
    		calculateSavingsPlan,
    		reviewSpending
    	});

    	$$self.$inject_state = $$props => {
    		if ('goal' in $$props) $$invalidate(2, goal = $$props.goal);
    		if ('currentSavings' in $$props) $$invalidate(0, currentSavings = $$props.currentSavings);
    		if ('cutSpendingReview' in $$props) $$invalidate(1, cutSpendingReview = $$props.cutSpendingReview);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		currentSavings,
    		cutSpendingReview,
    		goal,
    		calculateSavingsPlan,
    		reviewSpending,
    		savingsplan_currentSavings_binding
    	];
    }

    class Planning extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Planning",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */
    const file = "src\\App.svelte";

    // (50:37) 
    function create_if_block_2(ctx) {
    	let planning;
    	let current;
    	planning = new Planning({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(planning.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(planning, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(planning.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(planning.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(planning, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(50:37) ",
    		ctx
    	});

    	return block;
    }

    // (48:39) 
    function create_if_block_1(ctx) {
    	let financials;
    	let current;
    	financials = new Financials({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(financials.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(financials, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(financials.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(financials.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(financials, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(48:39) ",
    		ctx
    	});

    	return block;
    }

    // (46:0) {#if currentPage === 'overview'}
    function create_if_block(ctx) {
    	let overview;
    	let current;
    	overview = new Overview({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(overview.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(overview, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(overview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(overview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(overview, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(46:0) {#if currentPage === 'overview'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let nav;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let t5;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*currentPage*/ ctx[0] === 'overview') return 0;
    		if (/*currentPage*/ ctx[0] === 'financials') return 1;
    		if (/*currentPage*/ ctx[0] === 'planning') return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			button0 = element("button");
    			button0.textContent = "Overview";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Financials";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "Planning";
    			t5 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(button0, "class", "svelte-8gk078");
    			add_location(button0, file, 40, 2, 733);
    			attr_dev(button1, "class", "svelte-8gk078");
    			add_location(button1, file, 41, 2, 799);
    			attr_dev(button2, "class", "svelte-8gk078");
    			add_location(button2, file, 42, 2, 869);
    			attr_dev(nav, "class", "svelte-8gk078");
    			add_location(nav, file, 39, 0, 725);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, button0);
    			append_dev(nav, t1);
    			append_dev(nav, button1);
    			append_dev(nav, t3);
    			append_dev(nav, button2);
    			insert_dev(target, t5, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[2], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[3], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[4], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t5);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let currentPage = 'overview';

    	function navigate(page) {
    		$$invalidate(0, currentPage = page);
    	}

    	onMount(() => {
    		
    	}); // Initialize any necessary data or state here

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => navigate('overview');
    	const click_handler_1 = () => navigate('financials');
    	const click_handler_2 = () => navigate('planning');

    	$$self.$capture_state = () => ({
    		Overview,
    		Financials,
    		Planning,
    		onMount,
    		currentPage,
    		navigate
    	});

    	$$self.$inject_state = $$props => {
    		if ('currentPage' in $$props) $$invalidate(0, currentPage = $$props.currentPage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentPage, navigate, click_handler, click_handler_1, click_handler_2];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
