
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
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
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
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
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
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
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function each(items, fn) {
        let str = '';
        for (let i = 0; i < items.length; i += 1) {
            str += fn(items[i], i);
        }
        return str;
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
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
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
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
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
        if (text.wholeText === data)
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

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function parse(str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.38.2 */

    const { Error: Error_1, Object: Object_1, console: console_1$1 } = globals;

    // (251:0) {:else}
    function create_else_block$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(251:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:0) {#if componentParams}
    function create_if_block$2(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location$1 = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		const newState = { ...history.state };
    		delete newState["__svelte_spa_router_scrollX"];
    		delete newState["__svelte_spa_router_scrollY"];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute("href");

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == "/") {
    		// Add # to the href attribute
    		href = "#" + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != "#/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	node.setAttribute("href", href);

    	node.addEventListener("click", event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute("href"));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == "string") {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument - strings must start with / or *");
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == "string") {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || "/";
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.__svelte_spa_router_scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener("popstate", popStateChanged);

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.__svelte_spa_router_scrollX, previousScrollState.__svelte_spa_router_scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData,
    				params: match && typeof match == "object" && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener("popstate", popStateChanged);
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location: location$1,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("popStateChanged" in $$props) popStateChanged = $$props.popStateChanged;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var apikey="4a90af4059b1aef354cede6812fa489f";

    const getDataURL = (file) => {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onerror = () => {
                reader.abort();
                reject(new DOMException("File input error : File Reader"));
            };
            reader.onload = () => {
                resolve(reader.result);
            };
            reader.readAsDataURL(file);
        });
    };

    const uploadImage = async (image) => {

        const host = `https://api.imgbb.com/1/upload?key=${apikey}`;

        var form = new FormData();
        form.append("image", image);

        const header = {
            'Accept': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Connection': 'keep-alive',
        };

        const options = {
            'method': 'POST',
            'header': header,
            'body': form,
        };

        var result = await fetch(host, options).then((response) => {
            return response.json();
        });

        return result;
    };

    const imgbbUploader = async (image) => {
        await getDataURL(image).then((result) => {
        });
        var result = await uploadImage(image);
        return result;

    };

    /* src/components/ImagePicker/ImagePicker.svelte generated by Svelte v3.38.2 */
    const file$6 = "src/components/ImagePicker/ImagePicker.svelte";

    function create_fragment$8(ctx) {
    	let div7;
    	let div6;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div3;
    	let div2;
    	let button0;
    	let t1;
    	let button0_disabled_value;
    	let t2;
    	let div1;
    	let span;
    	let t4;
    	let div5;
    	let div4;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div6 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div3 = element("div");
    			div2 = element("div");
    			button0 = element("button");
    			t1 = text("+");
    			t2 = space();
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "Uploading...";
    			t4 = space();
    			div5 = element("div");
    			div4 = element("div");
    			button1 = element("button");
    			button1.textContent = "X";
    			if (img.src !== (img_src_value = /*imageURL*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "align-self-center mh-100 mw-100 w-auto h-auto");
    			attr_dev(img, "alt", "이미지");
    			add_location(img, file$6, 52, 6, 1354);
    			attr_dev(div0, "class", "d-flex justify-content-center align-items-center h-100");
    			add_location(div0, file$6, 51, 4, 1279);
    			attr_dev(button0, "class", "btn btn-lg btn-floating btn-light");
    			button0.disabled = button0_disabled_value = !/*active*/ ctx[1];
    			toggle_class(button0, "d-none", /*isUploaded*/ ctx[0] || /*isUploading*/ ctx[3]);
    			add_location(button0, file$6, 64, 8, 1694);
    			attr_dev(span, "class", "visually-hidden");
    			add_location(span, file$6, 78, 10, 2075);
    			attr_dev(div1, "class", "spinner-border");
    			attr_dev(div1, "role", "status");
    			toggle_class(div1, "d-none", !/*isUploading*/ ctx[3]);
    			toggle_class(div1, "d-block", /*isUploading*/ ctx[3]);
    			add_location(div1, file$6, 72, 8, 1917);
    			attr_dev(div2, "class", "d-flex justify-content-center align-items-center h-100");
    			add_location(div2, file$6, 63, 6, 1617);
    			attr_dev(div3, "class", "mask");
    			set_style(div3, "background-color", "rgba(255,255,255," + /*maskOpacity*/ ctx[4] + ")");
    			toggle_class(div3, "d-none", /*isUploaded*/ ctx[0]);
    			add_location(div3, file$6, 58, 4, 1486);
    			attr_dev(button1, "class", "btn btn-danger btn-small btn-floating");
    			add_location(button1, file$6, 84, 8, 2279);
    			attr_dev(div4, "class", "d-flex justify-content-end h-100 p-2");
    			add_location(div4, file$6, 83, 6, 2220);
    			attr_dev(div5, "class", "mask");
    			toggle_class(div5, "d-none", !/*isUploaded*/ ctx[0]);
    			add_location(div5, file$6, 82, 4, 2168);
    			attr_dev(div6, "class", "bg-image h-100");
    			add_location(div6, file$6, 50, 2, 1246);
    			attr_dev(div7, "class", "card border square w-100 h-100 shadow-none");
    			attr_dev(div7, "id", "pickerCard");
    			add_location(div7, file$6, 49, 0, 1171);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div0);
    			append_dev(div0, img);
    			append_dev(div6, t0);
    			append_dev(div6, div3);
    			append_dev(div3, div2);
    			append_dev(div2, button0);
    			append_dev(button0, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, span);
    			append_dev(div6, t4);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*input*/ ctx[5].click())) /*input*/ ctx[5].click().apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(button1, "click", /*deleteImage*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*imageURL*/ 4 && img.src !== (img_src_value = /*imageURL*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*active*/ 2 && button0_disabled_value !== (button0_disabled_value = !/*active*/ ctx[1])) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*isUploaded, isUploading*/ 9) {
    				toggle_class(button0, "d-none", /*isUploaded*/ ctx[0] || /*isUploading*/ ctx[3]);
    			}

    			if (dirty & /*isUploading*/ 8) {
    				toggle_class(div1, "d-none", !/*isUploading*/ ctx[3]);
    			}

    			if (dirty & /*isUploading*/ 8) {
    				toggle_class(div1, "d-block", /*isUploading*/ ctx[3]);
    			}

    			if (dirty & /*maskOpacity*/ 16) {
    				set_style(div3, "background-color", "rgba(255,255,255," + /*maskOpacity*/ ctx[4] + ")");
    			}

    			if (dirty & /*isUploaded*/ 1) {
    				toggle_class(div3, "d-none", /*isUploaded*/ ctx[0]);
    			}

    			if (dirty & /*isUploaded*/ 1) {
    				toggle_class(div5, "d-none", !/*isUploaded*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ImagePicker", slots, []);
    	let { value = undefined } = $$props;
    	let { active = false } = $$props;
    	let { isUploaded = false } = $$props;
    	let blank = "/images/blank.png";
    	let imageURL = blank;
    	let isUploading = false;
    	let maskOpacity = 0.5;
    	let input = document.createElement("input");
    	input.setAttribute("type", "file");
    	input.setAttribute("accept", "image/*");

    	let deleteImage = () => {
    		$$invalidate(0, isUploaded = false);
    		$$invalidate(2, imageURL = blank);
    		$$invalidate(7, value = "");
    		$$invalidate(5, input.value = "", input);
    	};

    	input.onchange = async () => {
    		if (input.value == "") {
    			return;
    		}

    		$$invalidate(2, imageURL = await getDataURL(input.files[0]).then(result => {
    			$$invalidate(3, isUploading = true);
    			$$invalidate(4, maskOpacity = 0.7);
    			return result;
    		}));

    		await imgbbUploader(input.files[0]).then(response => {
    			if (response["success"] == true) {
    				$$invalidate(3, isUploading = false);
    				$$invalidate(4, maskOpacity = 0);
    				$$invalidate(0, isUploaded = true);
    				$$invalidate(7, value = response["data"]["url"]);
    				$$invalidate(2, imageURL = value);
    			} else {
    				$$invalidate(2, imageURL = blank);
    				$$invalidate(3, isUploading = false);
    				$$invalidate(0, isUploaded = false);
    				$$invalidate(7, value = "");
    			}
    		});
    	};

    	const writable_props = ["value", "active", "isUploaded"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImagePicker> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(7, value = $$props.value);
    		if ("active" in $$props) $$invalidate(1, active = $$props.active);
    		if ("isUploaded" in $$props) $$invalidate(0, isUploaded = $$props.isUploaded);
    	};

    	$$self.$capture_state = () => ({
    		imgbbUploader,
    		getDataURL,
    		value,
    		active,
    		isUploaded,
    		blank,
    		imageURL,
    		isUploading,
    		maskOpacity,
    		input,
    		deleteImage
    	});

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(7, value = $$props.value);
    		if ("active" in $$props) $$invalidate(1, active = $$props.active);
    		if ("isUploaded" in $$props) $$invalidate(0, isUploaded = $$props.isUploaded);
    		if ("blank" in $$props) blank = $$props.blank;
    		if ("imageURL" in $$props) $$invalidate(2, imageURL = $$props.imageURL);
    		if ("isUploading" in $$props) $$invalidate(3, isUploading = $$props.isUploading);
    		if ("maskOpacity" in $$props) $$invalidate(4, maskOpacity = $$props.maskOpacity);
    		if ("input" in $$props) $$invalidate(5, input = $$props.input);
    		if ("deleteImage" in $$props) $$invalidate(6, deleteImage = $$props.deleteImage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		isUploaded,
    		active,
    		imageURL,
    		isUploading,
    		maskOpacity,
    		input,
    		deleteImage,
    		value
    	];
    }

    class ImagePicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { value: 7, active: 1, isUploaded: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImagePicker",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get value() {
    		throw new Error("<ImagePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<ImagePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<ImagePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<ImagePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isUploaded() {
    		throw new Error("<ImagePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isUploaded(value) {
    		throw new Error("<ImagePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const selectAll = async (tableName) => {
        const host = 'http://localhost:3000/api/' + tableName;
        const header = {
            'Accept': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Connection': 'keep-alive',
        };

        const options = {
            'method': 'GET',
            'header': header,
        };

        const response = await fetch(host, options);

        if (response.ok) {
            return response.json();
        } else {
            return response.ok;
        }
    };

    const postForm = async (body) => {
        const host = 'http://localhost:3000/api/insert_request';

        const options = {
            'method': 'POST',
            'header': {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            'body': body,
        };

        const response = await fetch(host, options);

        if (response.ok) {
            return response.json();
        } else {
            return response.ok;
        }
    };

    const getLivingTypes = () => {
        return selectAll('get_living_type');
    };

    const getProductTypes = () => {
        return selectAll('get_product_type');
    };

    /* src/components/Alert.svelte generated by Svelte v3.38.2 */

    const file$5 = "src/components/Alert.svelte";

    // (9:0) {#if showAlert}
    function create_if_block$1(ctx) {
    	let div1;
    	let div0;
    	let span;
    	let t0;
    	let t1;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			t0 = text(/*message*/ ctx[1]);
    			t1 = space();
    			button = element("button");
    			add_location(span, file$5, 11, 6, 259);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn-close");
    			add_location(button, file$5, 12, 6, 288);
    			attr_dev(div0, "class", "d-flex justify-content-between align-items-center");
    			add_location(div0, file$5, 10, 4, 189);
    			attr_dev(div1, "class", "alert alert-danger");
    			add_location(div1, file$5, 9, 2, 152);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(span, t0);
    			append_dev(div0, t1);
    			append_dev(div0, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*closeAlert*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 2) set_data_dev(t0, /*message*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(9:0) {#if showAlert}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let if_block_anchor;
    	let if_block = /*showAlert*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showAlert*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	validate_slots("Alert", slots, []);
    	let { message = "" } = $$props;
    	let { showAlert = false } = $$props;

    	let closeAlert = () => {
    		$$invalidate(0, showAlert = false);
    	};

    	const writable_props = ["message", "showAlert"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Alert> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("message" in $$props) $$invalidate(1, message = $$props.message);
    		if ("showAlert" in $$props) $$invalidate(0, showAlert = $$props.showAlert);
    	};

    	$$self.$capture_state = () => ({ message, showAlert, closeAlert });

    	$$self.$inject_state = $$props => {
    		if ("message" in $$props) $$invalidate(1, message = $$props.message);
    		if ("showAlert" in $$props) $$invalidate(0, showAlert = $$props.showAlert);
    		if ("closeAlert" in $$props) $$invalidate(2, closeAlert = $$props.closeAlert);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showAlert, message, closeAlert];
    }

    class Alert extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { message: 1, showAlert: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Alert",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get message() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showAlert() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showAlert(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/RequestForm.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;
    const file$4 = "src/routes/RequestForm.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[33] = list[i].type_no;
    	child_ctx[34] = list[i].type;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[33] = list[i].type_no;
    	child_ctx[34] = list[i].type;
    	return child_ctx;
    }

    // (358:10) {:else}
    function create_else_block(ctx) {
    	let div;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block_2,
    		then: create_then_block_2,
    		catch: create_catch_block_2,
    		value: 39
    	};

    	handle_promise(promise = /*postResult*/ ctx[3], info);

    	const block = {
    		c: function create() {
    			div = element("div");
    			info.block.c();
    			attr_dev(div, "class", "card-body");
    			add_location(div, file$4, 358, 12, 11457);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = null;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty[0] & /*postResult*/ 8 && promise !== (promise = /*postResult*/ ctx[3]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(358:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (156:10) {#if !submitted}
    function create_if_block(ctx) {
    	let div21;
    	let h2;
    	let t1;
    	let p;
    	let t3;
    	let hr0;
    	let t4;
    	let div0;
    	let h50;
    	let t6;
    	let input0;
    	let t7;
    	let hr1;
    	let t8;
    	let div6;
    	let h51;
    	let t10;
    	let div5;
    	let div1;
    	let imagepicker0;
    	let updating_value;
    	let t11;
    	let div2;
    	let imagepicker1;
    	let updating_value_1;
    	let t12;
    	let div3;
    	let imagepicker2;
    	let updating_value_2;
    	let t13;
    	let div4;
    	let imagepicker3;
    	let updating_value_3;
    	let t14;
    	let hr2;
    	let t15;
    	let div8;
    	let h52;
    	let t17;
    	let div7;
    	let t18;
    	let hr3;
    	let t19;
    	let div10;
    	let h53;
    	let t21;
    	let div9;
    	let t22;
    	let hr4;
    	let t23;
    	let div12;
    	let h54;
    	let t25;
    	let div11;
    	let input1;
    	let t26;
    	let span;
    	let t28;
    	let hr5;
    	let t29;
    	let div14;
    	let h55;
    	let t31;
    	let div13;
    	let input2;
    	let t32;
    	let label0;
    	let t34;
    	let input3;
    	let t35;
    	let label1;
    	let t37;
    	let hr6;
    	let t38;
    	let div16;
    	let h56;
    	let t40;
    	let div15;
    	let input4;
    	let t41;
    	let label2;
    	let t43;
    	let input5;
    	let t44;
    	let label3;
    	let t46;
    	let input6;
    	let t47;
    	let label4;
    	let t49;
    	let hr7;
    	let t50;
    	let div17;
    	let h57;
    	let t52;
    	let textarea;
    	let t53;
    	let div20;
    	let alert_1;
    	let updating_showAlert;
    	let updating_message;
    	let t54;
    	let div18;
    	let button0;
    	let t56;
    	let div19;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;

    	function imagepicker0_value_binding(value) {
    		/*imagepicker0_value_binding*/ ctx[21](value);
    	}

    	let imagepicker0_props = { active: true };

    	if (/*images*/ ctx[6][0] !== void 0) {
    		imagepicker0_props.value = /*images*/ ctx[6][0];
    	}

    	imagepicker0 = new ImagePicker({
    			props: imagepicker0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(imagepicker0, "value", imagepicker0_value_binding));

    	function imagepicker1_value_binding(value) {
    		/*imagepicker1_value_binding*/ ctx[22](value);
    	}

    	let imagepicker1_props = { active: true };

    	if (/*images*/ ctx[6][1] !== void 0) {
    		imagepicker1_props.value = /*images*/ ctx[6][1];
    	}

    	imagepicker1 = new ImagePicker({
    			props: imagepicker1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(imagepicker1, "value", imagepicker1_value_binding));

    	function imagepicker2_value_binding(value) {
    		/*imagepicker2_value_binding*/ ctx[23](value);
    	}

    	let imagepicker2_props = { active: true };

    	if (/*images*/ ctx[6][2] !== void 0) {
    		imagepicker2_props.value = /*images*/ ctx[6][2];
    	}

    	imagepicker2 = new ImagePicker({
    			props: imagepicker2_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(imagepicker2, "value", imagepicker2_value_binding));

    	function imagepicker3_value_binding(value) {
    		/*imagepicker3_value_binding*/ ctx[24](value);
    	}

    	let imagepicker3_props = { active: true };

    	if (/*images*/ ctx[6][3] !== void 0) {
    		imagepicker3_props.value = /*images*/ ctx[6][3];
    	}

    	imagepicker3 = new ImagePicker({
    			props: imagepicker3_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(imagepicker3, "value", imagepicker3_value_binding));

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block_1,
    		then: create_then_block_1,
    		catch: create_catch_block_1,
    		value: 32
    	};

    	handle_promise(/*productTypes*/ ctx[14], info);

    	let info_1 = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 32
    	};

    	handle_promise(/*livingTypes*/ ctx[13], info_1);

    	function alert_1_showAlert_binding(value) {
    		/*alert_1_showAlert_binding*/ ctx[27](value);
    	}

    	function alert_1_message_binding(value) {
    		/*alert_1_message_binding*/ ctx[28](value);
    	}

    	let alert_1_props = {};

    	if (/*showAlert*/ ctx[1] !== void 0) {
    		alert_1_props.showAlert = /*showAlert*/ ctx[1];
    	}

    	if (/*message*/ ctx[2] !== void 0) {
    		alert_1_props.message = /*message*/ ctx[2];
    	}

    	alert_1 = new Alert({ props: alert_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(alert_1, "showAlert", alert_1_showAlert_binding));
    	binding_callbacks.push(() => bind(alert_1, "message", alert_1_message_binding));

    	const block = {
    		c: function create() {
    			div21 = element("div");
    			h2 = element("h2");
    			h2.textContent = "설치 견적 접수";
    			t1 = space();
    			p = element("p");
    			p.textContent = "아래 양식에 맞게 작성해주세요";
    			t3 = space();
    			hr0 = element("hr");
    			t4 = space();
    			div0 = element("div");
    			h50 = element("h5");
    			h50.textContent = "고객명 (카카오톡)";
    			t6 = space();
    			input0 = element("input");
    			t7 = space();
    			hr1 = element("hr");
    			t8 = space();
    			div6 = element("div");
    			h51 = element("h5");
    			h51.textContent = "사진";
    			t10 = space();
    			div5 = element("div");
    			div1 = element("div");
    			create_component(imagepicker0.$$.fragment);
    			t11 = space();
    			div2 = element("div");
    			create_component(imagepicker1.$$.fragment);
    			t12 = space();
    			div3 = element("div");
    			create_component(imagepicker2.$$.fragment);
    			t13 = space();
    			div4 = element("div");
    			create_component(imagepicker3.$$.fragment);
    			t14 = space();
    			hr2 = element("hr");
    			t15 = space();
    			div8 = element("div");
    			h52 = element("h5");
    			h52.textContent = "에어컨 형태";
    			t17 = space();
    			div7 = element("div");
    			info.block.c();
    			t18 = space();
    			hr3 = element("hr");
    			t19 = space();
    			div10 = element("div");
    			h53 = element("h5");
    			h53.textContent = "주거 형태";
    			t21 = space();
    			div9 = element("div");
    			info_1.block.c();
    			t22 = space();
    			hr4 = element("hr");
    			t23 = space();
    			div12 = element("div");
    			h54 = element("h5");
    			h54.textContent = "층수";
    			t25 = space();
    			div11 = element("div");
    			input1 = element("input");
    			t26 = space();
    			span = element("span");
    			span.textContent = "층";
    			t28 = space();
    			hr5 = element("hr");
    			t29 = space();
    			div14 = element("div");
    			h55 = element("h5");
    			h55.textContent = "매립배관 여부";
    			t31 = space();
    			div13 = element("div");
    			input2 = element("input");
    			t32 = space();
    			label0 = element("label");
    			label0.textContent = "O";
    			t34 = space();
    			input3 = element("input");
    			t35 = space();
    			label1 = element("label");
    			label1.textContent = "X";
    			t37 = space();
    			hr6 = element("hr");
    			t38 = space();
    			div16 = element("div");
    			h56 = element("h5");
    			h56.textContent = "철거 여부";
    			t40 = space();
    			div15 = element("div");
    			input4 = element("input");
    			t41 = space();
    			label2 = element("label");
    			label2.textContent = "철거 후 보관";
    			t43 = space();
    			input5 = element("input");
    			t44 = space();
    			label3 = element("label");
    			label3.textContent = "철거 후 폐기";
    			t46 = space();
    			input6 = element("input");
    			t47 = space();
    			label4 = element("label");
    			label4.textContent = "기존제품 없음";
    			t49 = space();
    			hr7 = element("hr");
    			t50 = space();
    			div17 = element("div");
    			h57 = element("h5");
    			h57.textContent = "기타 요청사항";
    			t52 = space();
    			textarea = element("textarea");
    			t53 = space();
    			div20 = element("div");
    			create_component(alert_1.$$.fragment);
    			t54 = space();
    			div18 = element("div");
    			button0 = element("button");
    			button0.textContent = "이전";
    			t56 = space();
    			div19 = element("div");
    			button1 = element("button");
    			button1.textContent = "접수";
    			attr_dev(h2, "class", "card-title");
    			add_location(h2, file$4, 157, 14, 4300);
    			attr_dev(p, "class", "card-text");
    			add_location(p, file$4, 158, 14, 4351);
    			add_location(hr0, file$4, 159, 14, 4407);
    			attr_dev(h50, "class", "card-title");
    			add_location(h50, file$4, 162, 16, 4498);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control form-control-lg border");
    			input0.required = true;
    			add_location(input0, file$4, 163, 16, 4553);
    			attr_dev(div0, "class", "form-outline");
    			add_location(div0, file$4, 161, 14, 4455);
    			add_location(hr1, file$4, 170, 14, 4769);
    			attr_dev(h51, "class", "card-title");
    			add_location(h51, file$4, 173, 16, 4859);
    			attr_dev(div1, "class", "col-lg-3 col-6 p-1");
    			add_location(div1, file$4, 175, 18, 4946);
    			attr_dev(div2, "class", "col-lg-3 col-6 p-1");
    			add_location(div2, file$4, 178, 18, 5088);
    			attr_dev(div3, "class", "col-lg-3 col-6 p-1");
    			add_location(div3, file$4, 182, 18, 5231);
    			attr_dev(div4, "class", "col-lg-3 col-6 p-1");
    			add_location(div4, file$4, 186, 18, 5374);
    			attr_dev(div5, "class", "row p-2");
    			add_location(div5, file$4, 174, 16, 4906);
    			attr_dev(div6, "class", "form-outline");
    			add_location(div6, file$4, 172, 14, 4816);
    			add_location(hr2, file$4, 191, 14, 5556);
    			attr_dev(h52, "class", "card-title");
    			add_location(h52, file$4, 194, 16, 5649);
    			attr_dev(div7, "class", "btn-group m-1");
    			add_location(div7, file$4, 195, 16, 5700);
    			attr_dev(div8, "class", "form-outline");
    			add_location(div8, file$4, 193, 14, 5606);
    			add_location(hr3, file$4, 214, 14, 6438);
    			attr_dev(h53, "class", "card-title");
    			add_location(h53, file$4, 217, 16, 6531);
    			attr_dev(div9, "class", "btn-group m-1");
    			add_location(div9, file$4, 218, 16, 6581);
    			attr_dev(div10, "class", "form-outline");
    			add_location(div10, file$4, 216, 14, 6488);
    			add_location(hr4, file$4, 237, 14, 7314);
    			attr_dev(h54, "class", "card-title");
    			add_location(h54, file$4, 241, 16, 7405);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "class", "form-control form-control-lg border w-25");
    			add_location(input1, file$4, 243, 18, 7510);
    			attr_dev(span, "class", "p-1");
    			add_location(span, file$4, 248, 18, 7705);
    			attr_dev(div11, "class", "d-flex align-items-center");
    			add_location(div11, file$4, 242, 16, 7452);
    			attr_dev(div12, "class", "form-outline");
    			add_location(div12, file$4, 240, 14, 7362);
    			add_location(hr5, file$4, 251, 14, 7790);
    			attr_dev(h55, "class", "card-title");
    			add_location(h55, file$4, 255, 16, 7886);
    			attr_dev(input2, "type", "radio");
    			attr_dev(input2, "class", "btn-check");
    			attr_dev(input2, "name", "isburiedpipe");
    			attr_dev(input2, "id", "isburiedpipe1");
    			input2.value = "true";
    			input2.required = true;
    			add_location(input2, file$4, 257, 18, 7984);
    			attr_dev(label0, "class", "btn btn-light btn-lg");
    			attr_dev(label0, "for", "isburiedpipe1");
    			add_location(label0, file$4, 266, 18, 8293);
    			attr_dev(input3, "type", "radio");
    			attr_dev(input3, "class", "btn-check");
    			attr_dev(input3, "name", "isburiedpipe");
    			attr_dev(input3, "id", "isburiedpipe2");
    			input3.value = "false";
    			input3.required = true;
    			add_location(input3, file$4, 269, 18, 8417);
    			attr_dev(label1, "class", "btn btn-light btn-lg");
    			attr_dev(label1, "for", "isburiedpipe2");
    			add_location(label1, file$4, 278, 18, 8727);
    			attr_dev(div13, "class", "btn-group m-1");
    			add_location(div13, file$4, 256, 16, 7938);
    			attr_dev(div14, "class", "form-outline");
    			add_location(div14, file$4, 254, 14, 7843);
    			add_location(hr6, file$4, 283, 14, 8891);
    			attr_dev(h56, "class", "card-title");
    			add_location(h56, file$4, 286, 16, 8984);
    			attr_dev(input4, "type", "radio");
    			attr_dev(input4, "class", "btn-check");
    			attr_dev(input4, "name", "uninstalloption");
    			attr_dev(input4, "id", "uninstalloption1");
    			input4.value = "보관";
    			add_location(input4, file$4, 288, 18, 9080);
    			attr_dev(label2, "class", "btn btn-light btn-lg");
    			attr_dev(label2, "for", "uninstalloption1");
    			add_location(label2, file$4, 296, 18, 9367);
    			attr_dev(input5, "type", "radio");
    			attr_dev(input5, "class", "btn-check");
    			attr_dev(input5, "name", "uninstalloption");
    			attr_dev(input5, "id", "uninstalloption2");
    			input5.value = "폐기";
    			add_location(input5, file$4, 299, 18, 9500);
    			attr_dev(label3, "class", "btn btn-light btn-lg");
    			attr_dev(label3, "for", "uninstalloption2");
    			add_location(label3, file$4, 307, 18, 9787);
    			attr_dev(input6, "type", "radio");
    			attr_dev(input6, "class", "btn-check");
    			attr_dev(input6, "name", "uninstalloption");
    			attr_dev(input6, "id", "uninstalloption3");
    			input6.value = "없음";
    			add_location(input6, file$4, 310, 18, 9920);
    			attr_dev(label4, "class", "btn btn-light btn-lg");
    			attr_dev(label4, "for", "uninstalloption3");
    			add_location(label4, file$4, 318, 18, 10207);
    			attr_dev(div15, "class", "btn-group m-1");
    			add_location(div15, file$4, 287, 16, 9034);
    			attr_dev(div16, "class", "form-outline");
    			add_location(div16, file$4, 285, 14, 8941);
    			add_location(hr7, file$4, 323, 14, 10380);
    			attr_dev(h57, "class", "card-title");
    			add_location(h57, file$4, 326, 16, 10472);
    			attr_dev(textarea, "class", "form-control border");
    			attr_dev(textarea, "rows", "4");
    			add_location(textarea, file$4, 327, 16, 10524);
    			attr_dev(div17, "class", "form-outline");
    			add_location(div17, file$4, 325, 14, 10429);
    			attr_dev(button0, "class", "btn btn-lg btn-light w-100");
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$4, 338, 18, 10858);
    			attr_dev(div18, "class", "col-3");
    			add_location(div18, file$4, 337, 16, 10820);
    			attr_dev(button1, "class", "btn btn-lg btn-success w-100");
    			attr_dev(button1, "type", "button");
    			add_location(button1, file$4, 347, 18, 11150);
    			attr_dev(div19, "class", "col-9");
    			add_location(div19, file$4, 346, 16, 11112);
    			attr_dev(div20, "class", "row mt-5");
    			add_location(div20, file$4, 335, 14, 10727);
    			attr_dev(div21, "class", "card-body");
    			add_location(div21, file$4, 156, 12, 4262);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div21, anchor);
    			append_dev(div21, h2);
    			append_dev(div21, t1);
    			append_dev(div21, p);
    			append_dev(div21, t3);
    			append_dev(div21, hr0);
    			append_dev(div21, t4);
    			append_dev(div21, div0);
    			append_dev(div0, h50);
    			append_dev(div0, t6);
    			append_dev(div0, input0);
    			set_input_value(input0, /*user*/ ctx[4]);
    			append_dev(div21, t7);
    			append_dev(div21, hr1);
    			append_dev(div21, t8);
    			append_dev(div21, div6);
    			append_dev(div6, h51);
    			append_dev(div6, t10);
    			append_dev(div6, div5);
    			append_dev(div5, div1);
    			mount_component(imagepicker0, div1, null);
    			append_dev(div5, t11);
    			append_dev(div5, div2);
    			mount_component(imagepicker1, div2, null);
    			append_dev(div5, t12);
    			append_dev(div5, div3);
    			mount_component(imagepicker2, div3, null);
    			append_dev(div5, t13);
    			append_dev(div5, div4);
    			mount_component(imagepicker3, div4, null);
    			append_dev(div21, t14);
    			append_dev(div21, hr2);
    			append_dev(div21, t15);
    			append_dev(div21, div8);
    			append_dev(div8, h52);
    			append_dev(div8, t17);
    			append_dev(div8, div7);
    			info.block.m(div7, info.anchor = null);
    			info.mount = () => div7;
    			info.anchor = null;
    			append_dev(div21, t18);
    			append_dev(div21, hr3);
    			append_dev(div21, t19);
    			append_dev(div21, div10);
    			append_dev(div10, h53);
    			append_dev(div10, t21);
    			append_dev(div10, div9);
    			info_1.block.m(div9, info_1.anchor = null);
    			info_1.mount = () => div9;
    			info_1.anchor = null;
    			append_dev(div21, t22);
    			append_dev(div21, hr4);
    			append_dev(div21, t23);
    			append_dev(div21, div12);
    			append_dev(div12, h54);
    			append_dev(div12, t25);
    			append_dev(div12, div11);
    			append_dev(div11, input1);
    			set_input_value(input1, /*floor_height*/ ctx[9]);
    			append_dev(div11, t26);
    			append_dev(div11, span);
    			append_dev(div21, t28);
    			append_dev(div21, hr5);
    			append_dev(div21, t29);
    			append_dev(div21, div14);
    			append_dev(div14, h55);
    			append_dev(div14, t31);
    			append_dev(div14, div13);
    			append_dev(div13, input2);
    			append_dev(div13, t32);
    			append_dev(div13, label0);
    			append_dev(div13, t34);
    			append_dev(div13, input3);
    			append_dev(div13, t35);
    			append_dev(div13, label1);
    			append_dev(div21, t37);
    			append_dev(div21, hr6);
    			append_dev(div21, t38);
    			append_dev(div21, div16);
    			append_dev(div16, h56);
    			append_dev(div16, t40);
    			append_dev(div16, div15);
    			append_dev(div15, input4);
    			append_dev(div15, t41);
    			append_dev(div15, label2);
    			append_dev(div15, t43);
    			append_dev(div15, input5);
    			append_dev(div15, t44);
    			append_dev(div15, label3);
    			append_dev(div15, t46);
    			append_dev(div15, input6);
    			append_dev(div15, t47);
    			append_dev(div15, label4);
    			append_dev(div21, t49);
    			append_dev(div21, hr7);
    			append_dev(div21, t50);
    			append_dev(div21, div17);
    			append_dev(div17, h57);
    			append_dev(div17, t52);
    			append_dev(div17, textarea);
    			set_input_value(textarea, /*comment*/ ctx[12]);
    			append_dev(div21, t53);
    			append_dev(div21, div20);
    			mount_component(alert_1, div20, null);
    			append_dev(div20, t54);
    			append_dev(div20, div18);
    			append_dev(div18, button0);
    			append_dev(div20, t56);
    			append_dev(div20, div19);
    			append_dev(div19, button1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[20]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[25]),
    					listen_dev(input2, "change", /*changeIsBuriedPipe*/ ctx[18], false, false, false),
    					listen_dev(input3, "change", /*changeIsBuriedPipe*/ ctx[18], false, false, false),
    					listen_dev(input4, "change", /*changeUninstallOption*/ ctx[19], false, false, false),
    					listen_dev(input5, "change", /*changeUninstallOption*/ ctx[19], false, false, false),
    					listen_dev(input6, "change", /*changeUninstallOption*/ ctx[19], false, false, false),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[26]),
    					listen_dev(button0, "click", /*click_handler*/ ctx[29], false, false, false),
    					listen_dev(button1, "click", /*handleSubmit*/ ctx[15], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*user*/ 16 && input0.value !== /*user*/ ctx[4]) {
    				set_input_value(input0, /*user*/ ctx[4]);
    			}

    			const imagepicker0_changes = {};

    			if (!updating_value && dirty[0] & /*images*/ 64) {
    				updating_value = true;
    				imagepicker0_changes.value = /*images*/ ctx[6][0];
    				add_flush_callback(() => updating_value = false);
    			}

    			imagepicker0.$set(imagepicker0_changes);
    			const imagepicker1_changes = {};

    			if (!updating_value_1 && dirty[0] & /*images*/ 64) {
    				updating_value_1 = true;
    				imagepicker1_changes.value = /*images*/ ctx[6][1];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			imagepicker1.$set(imagepicker1_changes);
    			const imagepicker2_changes = {};

    			if (!updating_value_2 && dirty[0] & /*images*/ 64) {
    				updating_value_2 = true;
    				imagepicker2_changes.value = /*images*/ ctx[6][2];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			imagepicker2.$set(imagepicker2_changes);
    			const imagepicker3_changes = {};

    			if (!updating_value_3 && dirty[0] & /*images*/ 64) {
    				updating_value_3 = true;
    				imagepicker3_changes.value = /*images*/ ctx[6][3];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			imagepicker3.$set(imagepicker3_changes);
    			update_await_block_branch(info, ctx, dirty);
    			update_await_block_branch(info_1, ctx, dirty);

    			if (dirty[0] & /*floor_height*/ 512 && to_number(input1.value) !== /*floor_height*/ ctx[9]) {
    				set_input_value(input1, /*floor_height*/ ctx[9]);
    			}

    			if (dirty[0] & /*comment*/ 4096) {
    				set_input_value(textarea, /*comment*/ ctx[12]);
    			}

    			const alert_1_changes = {};

    			if (!updating_showAlert && dirty[0] & /*showAlert*/ 2) {
    				updating_showAlert = true;
    				alert_1_changes.showAlert = /*showAlert*/ ctx[1];
    				add_flush_callback(() => updating_showAlert = false);
    			}

    			if (!updating_message && dirty[0] & /*message*/ 4) {
    				updating_message = true;
    				alert_1_changes.message = /*message*/ ctx[2];
    				add_flush_callback(() => updating_message = false);
    			}

    			alert_1.$set(alert_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imagepicker0.$$.fragment, local);
    			transition_in(imagepicker1.$$.fragment, local);
    			transition_in(imagepicker2.$$.fragment, local);
    			transition_in(imagepicker3.$$.fragment, local);
    			transition_in(alert_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imagepicker0.$$.fragment, local);
    			transition_out(imagepicker1.$$.fragment, local);
    			transition_out(imagepicker2.$$.fragment, local);
    			transition_out(imagepicker3.$$.fragment, local);
    			transition_out(alert_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div21);
    			destroy_component(imagepicker0);
    			destroy_component(imagepicker1);
    			destroy_component(imagepicker2);
    			destroy_component(imagepicker3);
    			info.block.d();
    			info.token = null;
    			info = null;
    			info_1.block.d();
    			info_1.token = null;
    			info_1 = null;
    			destroy_component(alert_1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(156:10) {#if !submitted}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { push }
    function create_catch_block_2(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_2.name,
    		type: "catch",
    		source: "(1:0) <script>   import { push }",
    		ctx
    	});

    	return block;
    }

    // (362:14) {:then result}
    function create_then_block_2(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*result*/ ctx[39].success) return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block_2.name,
    		type: "then",
    		source: "(362:14) {:then result}",
    		ctx
    	});

    	return block;
    }

    // (369:16) {:else}
    function create_else_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "오류가 발생했습니다.";
    			add_location(p, file$4, 369, 18, 11824);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(369:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (363:16) {#if result.success}
    function create_if_block_1(ctx) {
    	let h1;
    	let t0;
    	let small;
    	let t1;
    	let t2_value = /*result*/ ctx[39].data.request_no + "";
    	let t2;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text("접수가 완료되었습니다.");
    			small = element("small");
    			t1 = text("접수번호 : ");
    			t2 = text(t2_value);
    			add_location(small, file$4, 364, 32, 11667);
    			add_location(h1, file$4, 363, 18, 11630);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			append_dev(h1, small);
    			append_dev(small, t1);
    			append_dev(small, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*postResult*/ 8 && t2_value !== (t2_value = /*result*/ ctx[39].data.request_no + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(363:16) {#if result.success}",
    		ctx
    	});

    	return block;
    }

    // (360:33)                  <p>waiting</p>               {:then result}
    function create_pending_block_2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "waiting";
    			add_location(p, file$4, 360, 16, 11531);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_2.name,
    		type: "pending",
    		source: "(360:33)                  <p>waiting</p>               {:then result}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { push }
    function create_catch_block_1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_1.name,
    		type: "catch",
    		source: "(1:0) <script>   import { push }",
    		ctx
    	});

    	return block;
    }

    // (197:50)                      {#each types as { type_no, type }}
    function create_then_block_1(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*types*/ ctx[32];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*productTypes, changeProductType*/ 81920) {
    				each_value_1 = /*types*/ ctx[32];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block_1.name,
    		type: "then",
    		source: "(197:50)                      {#each types as { type_no, type }}",
    		ctx
    	});

    	return block;
    }

    // (198:20) {#each types as { type_no, type }}
    function create_each_block_1(ctx) {
    	let input;
    	let t0;
    	let label;
    	let t1_value = /*type*/ ctx[34] + "";
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(t1_value);
    			attr_dev(input, "type", "radio");
    			attr_dev(input, "class", "btn-check");
    			attr_dev(input, "name", "producttype");
    			attr_dev(input, "id", "producttype" + /*type_no*/ ctx[33]);
    			input.value = /*type_no*/ ctx[33];
    			add_location(input, file$4, 198, 22, 5856);
    			attr_dev(label, "class", "btn btn-light btn-lg");
    			attr_dev(label, "for", "producttype" + /*type_no*/ ctx[33]);
    			add_location(label, file$4, 206, 22, 6176);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, label, anchor);
    			append_dev(label, t1);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*changeProductType*/ ctx[16], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(label);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(198:20) {#each types as { type_no, type }}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { push }
    function create_pending_block_1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_1.name,
    		type: "pending",
    		source: "(1:0) <script>   import { push }",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { push }
    function create_catch_block(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>   import { push }",
    		ctx
    	});

    	return block;
    }

    // (220:49)                      {#each types as { type_no, type }}
    function create_then_block(ctx) {
    	let each_1_anchor;
    	let each_value = /*types*/ ctx[32];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*livingTypes, changeLivingType*/ 139264) {
    				each_value = /*types*/ ctx[32];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(220:49)                      {#each types as { type_no, type }}",
    		ctx
    	});

    	return block;
    }

    // (221:20) {#each types as { type_no, type }}
    function create_each_block$1(ctx) {
    	let input;
    	let t0;
    	let label;
    	let t1_value = /*type*/ ctx[34] + "";
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(t1_value);
    			attr_dev(input, "type", "radio");
    			attr_dev(input, "class", "btn-check");
    			attr_dev(input, "name", "livingtype");
    			attr_dev(input, "id", "livingtype" + /*type_no*/ ctx[33]);
    			input.value = /*type_no*/ ctx[33];
    			add_location(input, file$4, 221, 22, 6736);
    			attr_dev(label, "class", "btn btn-light btn-lg");
    			attr_dev(label, "for", "livingtype" + /*type_no*/ ctx[33]);
    			add_location(label, file$4, 229, 22, 7053);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, label, anchor);
    			append_dev(label, t1);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*changeLivingType*/ ctx[17], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(label);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(221:20) {#each types as { type_no, type }}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { push }
    function create_pending_block(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(1:0) <script>   import { push }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let main;
    	let div7;
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let table;
    	let thead;
    	let tr0;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let tr1;
    	let td0;
    	let t5;
    	let td1;
    	let t6;
    	let t7;
    	let tr2;
    	let td2;
    	let t9;
    	let td3;
    	let t10;
    	let t11;
    	let tr3;
    	let td4;
    	let t13;
    	let td5;
    	let t14;
    	let t15;
    	let tr4;
    	let td6;
    	let t17;
    	let td7;
    	let t18;
    	let t19;
    	let tr5;
    	let td8;
    	let t21;
    	let td9;
    	let t22;
    	let t23;
    	let tr6;
    	let td10;
    	let t25;
    	let td11;
    	let t26;
    	let t27;
    	let tr7;
    	let td12;
    	let t29;
    	let td13;
    	let t30;
    	let t31;
    	let tr8;
    	let td14;
    	let t33;
    	let td15;
    	let t34;
    	let t35;
    	let tr9;
    	let td16;
    	let t37;
    	let td17;
    	let t38;
    	let t39;
    	let div6;
    	let div5;
    	let div4;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*submitted*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div7 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "variable";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "value";
    			t3 = space();
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "user";
    			t5 = space();
    			td1 = element("td");
    			t6 = text(/*user*/ ctx[4]);
    			t7 = space();
    			tr2 = element("tr");
    			td2 = element("td");
    			td2.textContent = "images";
    			t9 = space();
    			td3 = element("td");
    			t10 = text(/*images*/ ctx[6]);
    			t11 = space();
    			tr3 = element("tr");
    			td4 = element("td");
    			td4.textContent = "image_url";
    			t13 = space();
    			td5 = element("td");
    			t14 = text(/*image_url*/ ctx[5]);
    			t15 = space();
    			tr4 = element("tr");
    			td6 = element("td");
    			td6.textContent = "product_type";
    			t17 = space();
    			td7 = element("td");
    			t18 = text(/*product_type*/ ctx[7]);
    			t19 = space();
    			tr5 = element("tr");
    			td8 = element("td");
    			td8.textContent = "living_type";
    			t21 = space();
    			td9 = element("td");
    			t22 = text(/*living_type*/ ctx[8]);
    			t23 = space();
    			tr6 = element("tr");
    			td10 = element("td");
    			td10.textContent = "floor_height";
    			t25 = space();
    			td11 = element("td");
    			t26 = text(/*floor_height*/ ctx[9]);
    			t27 = space();
    			tr7 = element("tr");
    			td12 = element("td");
    			td12.textContent = "is_buried_pipe";
    			t29 = space();
    			td13 = element("td");
    			t30 = text(/*is_buried_pipe*/ ctx[10]);
    			t31 = space();
    			tr8 = element("tr");
    			td14 = element("td");
    			td14.textContent = "uninstall_option";
    			t33 = space();
    			td15 = element("td");
    			t34 = text(/*uninstall_option*/ ctx[11]);
    			t35 = space();
    			tr9 = element("tr");
    			td16 = element("td");
    			td16.textContent = "comment";
    			t37 = space();
    			td17 = element("td");
    			t38 = text(/*comment*/ ctx[12]);
    			t39 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			if_block.c();
    			add_location(th0, file$4, 100, 18, 2895);
    			add_location(th1, file$4, 101, 18, 2931);
    			add_location(tr0, file$4, 99, 16, 2872);
    			add_location(thead, file$4, 98, 14, 2848);
    			add_location(td0, file$4, 105, 16, 3026);
    			add_location(td1, file$4, 106, 16, 3056);
    			add_location(tr1, file$4, 104, 14, 3005);
    			add_location(td2, file$4, 110, 16, 3128);
    			add_location(td3, file$4, 111, 16, 3160);
    			add_location(tr2, file$4, 109, 14, 3107);
    			add_location(td4, file$4, 115, 16, 3234);
    			add_location(td5, file$4, 116, 16, 3269);
    			add_location(tr3, file$4, 114, 14, 3213);
    			add_location(td6, file$4, 120, 16, 3346);
    			add_location(td7, file$4, 121, 16, 3384);
    			add_location(tr4, file$4, 119, 14, 3325);
    			add_location(td8, file$4, 125, 16, 3464);
    			add_location(td9, file$4, 126, 16, 3501);
    			add_location(tr5, file$4, 124, 14, 3443);
    			add_location(td10, file$4, 130, 16, 3580);
    			add_location(td11, file$4, 131, 16, 3618);
    			add_location(tr6, file$4, 129, 14, 3559);
    			add_location(td12, file$4, 135, 16, 3698);
    			add_location(td13, file$4, 136, 16, 3738);
    			add_location(tr7, file$4, 134, 14, 3677);
    			add_location(td14, file$4, 139, 16, 3819);
    			add_location(td15, file$4, 140, 16, 3861);
    			add_location(tr8, file$4, 138, 14, 3798);
    			add_location(td16, file$4, 143, 16, 3944);
    			add_location(td17, file$4, 144, 16, 3977);
    			add_location(tr9, file$4, 142, 14, 3923);
    			attr_dev(table, "class", "table table-sm");
    			add_location(table, file$4, 97, 12, 2803);
    			attr_dev(div0, "class", "card-body");
    			add_location(div0, file$4, 96, 10, 2767);
    			attr_dev(div1, "class", "card");
    			add_location(div1, file$4, 95, 8, 2738);
    			attr_dev(div2, "class", "col-11 col-lg-8");
    			add_location(div2, file$4, 94, 6, 2700);
    			attr_dev(div3, "class", "row d-flex justify-content-center my-5");
    			add_location(div3, file$4, 93, 4, 2641);
    			attr_dev(div4, "class", "card rounded-0 p-2");
    			add_location(div4, file$4, 154, 8, 4190);
    			attr_dev(div5, "class", "col-11 col-lg-8");
    			add_location(div5, file$4, 153, 6, 4152);
    			attr_dev(div6, "class", "row d-flex justify-content-center");
    			add_location(div6, file$4, 152, 4, 4098);
    			attr_dev(div7, "class", "container p-3");
    			add_location(div7, file$4, 91, 2, 2585);
    			set_style(main, "background-image", "url('./images/mainform_background.png')");
    			set_style(main, "background-size", "cover");
    			set_style(main, "background-repeat", "no-repeat");
    			set_style(main, "background-position", "center center");
    			set_style(main, "height", "100%");
    			add_location(main, file$4, 84, 0, 2403);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div7);
    			append_dev(div7, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, table);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t1);
    			append_dev(tr0, th1);
    			append_dev(table, t3);
    			append_dev(table, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t5);
    			append_dev(tr1, td1);
    			append_dev(td1, t6);
    			append_dev(table, t7);
    			append_dev(table, tr2);
    			append_dev(tr2, td2);
    			append_dev(tr2, t9);
    			append_dev(tr2, td3);
    			append_dev(td3, t10);
    			append_dev(table, t11);
    			append_dev(table, tr3);
    			append_dev(tr3, td4);
    			append_dev(tr3, t13);
    			append_dev(tr3, td5);
    			append_dev(td5, t14);
    			append_dev(table, t15);
    			append_dev(table, tr4);
    			append_dev(tr4, td6);
    			append_dev(tr4, t17);
    			append_dev(tr4, td7);
    			append_dev(td7, t18);
    			append_dev(table, t19);
    			append_dev(table, tr5);
    			append_dev(tr5, td8);
    			append_dev(tr5, t21);
    			append_dev(tr5, td9);
    			append_dev(td9, t22);
    			append_dev(table, t23);
    			append_dev(table, tr6);
    			append_dev(tr6, td10);
    			append_dev(tr6, t25);
    			append_dev(tr6, td11);
    			append_dev(td11, t26);
    			append_dev(table, t27);
    			append_dev(table, tr7);
    			append_dev(tr7, td12);
    			append_dev(tr7, t29);
    			append_dev(tr7, td13);
    			append_dev(td13, t30);
    			append_dev(table, t31);
    			append_dev(table, tr8);
    			append_dev(tr8, td14);
    			append_dev(tr8, t33);
    			append_dev(tr8, td15);
    			append_dev(td15, t34);
    			append_dev(table, t35);
    			append_dev(table, tr9);
    			append_dev(tr9, td16);
    			append_dev(tr9, t37);
    			append_dev(tr9, td17);
    			append_dev(td17, t38);
    			append_dev(div7, t39);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			if_blocks[current_block_type_index].m(div4, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*user*/ 16) set_data_dev(t6, /*user*/ ctx[4]);
    			if (!current || dirty[0] & /*images*/ 64) set_data_dev(t10, /*images*/ ctx[6]);
    			if (!current || dirty[0] & /*image_url*/ 32) set_data_dev(t14, /*image_url*/ ctx[5]);
    			if (!current || dirty[0] & /*product_type*/ 128) set_data_dev(t18, /*product_type*/ ctx[7]);
    			if (!current || dirty[0] & /*living_type*/ 256) set_data_dev(t22, /*living_type*/ ctx[8]);
    			if (!current || dirty[0] & /*floor_height*/ 512) set_data_dev(t26, /*floor_height*/ ctx[9]);
    			if (!current || dirty[0] & /*is_buried_pipe*/ 1024) set_data_dev(t30, /*is_buried_pipe*/ ctx[10]);
    			if (!current || dirty[0] & /*uninstall_option*/ 2048) set_data_dev(t34, /*uninstall_option*/ ctx[11]);
    			if (!current || dirty[0] & /*comment*/ 4096) set_data_dev(t38, /*comment*/ ctx[12]);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div4, null);
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
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
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
    	validate_slots("RequestForm", slots, []);
    	const livingTypes = getLivingTypes();
    	const productTypes = getProductTypes();
    	let submitted = false;

    	const makeImageUrl = () => {
    		let result = "";

    		for (let i = 0; i < images.length; i++) {
    			if (images[i] != "" && images[i] != undefined) {
    				if (result != "") result += ",";
    				result += images[i];
    			}
    		}

    		return result;
    	};

    	const validateValues = () => {
    		$$invalidate(5, image_url = makeImageUrl());
    		if (user == "" || user == undefined) return false; else if (image_url == "" || image_url == undefined) return false; else if (product_type == undefined) return false; else if (living_type == undefined) return false; else if (floor_height == undefined) return false; else if (is_buried_pipe == undefined) return false; else if (uninstall_option == undefined) return false; else return true;
    	};

    	let showAlert = false;
    	let message = "";
    	let postResult;

    	const handleSubmit = () => {
    		if (validateValues()) {
    			alert("go submit");
    		} else {
    			$$invalidate(1, showAlert = true);
    			$$invalidate(2, message = "입력되지 않은 값이 있습니다.");
    		}

    		let payload = {
    			user,
    			image_url,
    			product_type,
    			living_type,
    			floor_height,
    			is_buried_pipe,
    			uninstall_option,
    			comment
    		};

    		$$invalidate(0, submitted = true);
    		$$invalidate(3, postResult = postForm(JSON.stringify(payload)));
    		console.log(postResult);
    	};

    	// input variables
    	let user;

    	let image_url;
    	let images = [];
    	let product_type;

    	let changeProductType = event => {
    		$$invalidate(7, product_type = event.currentTarget.value);
    	};

    	let living_type;

    	let changeLivingType = event => {
    		$$invalidate(8, living_type = event.currentTarget.value);
    	};

    	let floor_height;
    	let is_buried_pipe;

    	let changeIsBuriedPipe = event => {
    		if (event.currentTarget.value == "true") $$invalidate(10, is_buried_pipe = true); else $$invalidate(10, is_buried_pipe = false);
    	};

    	let uninstall_option;

    	let changeUninstallOption = event => {
    		$$invalidate(11, uninstall_option = event.currentTarget.value);
    	};

    	let comment = "";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<RequestForm> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		user = this.value;
    		$$invalidate(4, user);
    	}

    	function imagepicker0_value_binding(value) {
    		if ($$self.$$.not_equal(images[0], value)) {
    			images[0] = value;
    			$$invalidate(6, images);
    		}
    	}

    	function imagepicker1_value_binding(value) {
    		if ($$self.$$.not_equal(images[1], value)) {
    			images[1] = value;
    			$$invalidate(6, images);
    		}
    	}

    	function imagepicker2_value_binding(value) {
    		if ($$self.$$.not_equal(images[2], value)) {
    			images[2] = value;
    			$$invalidate(6, images);
    		}
    	}

    	function imagepicker3_value_binding(value) {
    		if ($$self.$$.not_equal(images[3], value)) {
    			images[3] = value;
    			$$invalidate(6, images);
    		}
    	}

    	function input1_input_handler() {
    		floor_height = to_number(this.value);
    		$$invalidate(9, floor_height);
    	}

    	function textarea_input_handler() {
    		comment = this.value;
    		$$invalidate(12, comment);
    	}

    	function alert_1_showAlert_binding(value) {
    		showAlert = value;
    		$$invalidate(1, showAlert);
    	}

    	function alert_1_message_binding(value) {
    		message = value;
    		$$invalidate(2, message);
    	}

    	const click_handler = () => push("/");

    	$$self.$capture_state = () => ({
    		push,
    		each,
    		ImagePicker,
    		getLivingTypes,
    		getProductTypes,
    		postForm,
    		Alert,
    		livingTypes,
    		productTypes,
    		submitted,
    		makeImageUrl,
    		validateValues,
    		showAlert,
    		message,
    		postResult,
    		handleSubmit,
    		user,
    		image_url,
    		images,
    		product_type,
    		changeProductType,
    		living_type,
    		changeLivingType,
    		floor_height,
    		is_buried_pipe,
    		changeIsBuriedPipe,
    		uninstall_option,
    		changeUninstallOption,
    		comment
    	});

    	$$self.$inject_state = $$props => {
    		if ("submitted" in $$props) $$invalidate(0, submitted = $$props.submitted);
    		if ("showAlert" in $$props) $$invalidate(1, showAlert = $$props.showAlert);
    		if ("message" in $$props) $$invalidate(2, message = $$props.message);
    		if ("postResult" in $$props) $$invalidate(3, postResult = $$props.postResult);
    		if ("user" in $$props) $$invalidate(4, user = $$props.user);
    		if ("image_url" in $$props) $$invalidate(5, image_url = $$props.image_url);
    		if ("images" in $$props) $$invalidate(6, images = $$props.images);
    		if ("product_type" in $$props) $$invalidate(7, product_type = $$props.product_type);
    		if ("changeProductType" in $$props) $$invalidate(16, changeProductType = $$props.changeProductType);
    		if ("living_type" in $$props) $$invalidate(8, living_type = $$props.living_type);
    		if ("changeLivingType" in $$props) $$invalidate(17, changeLivingType = $$props.changeLivingType);
    		if ("floor_height" in $$props) $$invalidate(9, floor_height = $$props.floor_height);
    		if ("is_buried_pipe" in $$props) $$invalidate(10, is_buried_pipe = $$props.is_buried_pipe);
    		if ("changeIsBuriedPipe" in $$props) $$invalidate(18, changeIsBuriedPipe = $$props.changeIsBuriedPipe);
    		if ("uninstall_option" in $$props) $$invalidate(11, uninstall_option = $$props.uninstall_option);
    		if ("changeUninstallOption" in $$props) $$invalidate(19, changeUninstallOption = $$props.changeUninstallOption);
    		if ("comment" in $$props) $$invalidate(12, comment = $$props.comment);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		submitted,
    		showAlert,
    		message,
    		postResult,
    		user,
    		image_url,
    		images,
    		product_type,
    		living_type,
    		floor_height,
    		is_buried_pipe,
    		uninstall_option,
    		comment,
    		livingTypes,
    		productTypes,
    		handleSubmit,
    		changeProductType,
    		changeLivingType,
    		changeIsBuriedPipe,
    		changeUninstallOption,
    		input0_input_handler,
    		imagepicker0_value_binding,
    		imagepicker1_value_binding,
    		imagepicker2_value_binding,
    		imagepicker3_value_binding,
    		input1_input_handler,
    		textarea_input_handler,
    		alert_1_showAlert_binding,
    		alert_1_message_binding,
    		click_handler
    	];
    }

    class RequestForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RequestForm",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/ImageHeader/ImageHeader.svelte generated by Svelte v3.38.2 */

    const file$3 = "src/components/ImageHeader/ImageHeader.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (6:2) {#each images as image, i}
    function create_each_block(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let a;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let div4;
    	let div3;
    	let img1;
    	let img1_src_value;
    	let t1;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			a = element("a");
    			img0 = element("img");
    			t0 = space();
    			div4 = element("div");
    			div3 = element("div");
    			img1 = element("img");
    			t1 = space();
    			if (img0.src !== (img0_src_value = /*image*/ ctx[1])) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "이미지" + /*i*/ ctx[3]);
    			attr_dev(img0, "class", "mh-100 mw-100 w-auto h-auto p-1");
    			attr_dev(img0, "data-mdb-toggle", "modal");
    			attr_dev(img0, "data-mdb-target", "#modal" + /*i*/ ctx[3]);
    			add_location(img0, file$3, 14, 12, 349);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "h-100 w-100 d-flex justify-content-center align-items-center");
    			add_location(a, file$3, 10, 10, 220);
    			attr_dev(div0, "class", "content svelte-8pu3ms");
    			add_location(div0, file$3, 9, 8, 188);
    			attr_dev(div1, "class", "square border svelte-8pu3ms");
    			add_location(div1, file$3, 8, 6, 152);
    			attr_dev(div2, "class", "col-3 p-1");
    			add_location(div2, file$3, 7, 4, 122);
    			if (img1.src !== (img1_src_value = /*image*/ ctx[1])) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "이미지" + /*i*/ ctx[3]);
    			attr_dev(img1, "class", "img-fluid p-3");
    			add_location(img1, file$3, 35, 8, 854);
    			attr_dev(div3, "class", "modal-dialog modal-dialog-centered");
    			add_location(div3, file$3, 34, 6, 797);
    			attr_dev(div4, "class", "modal fade");
    			attr_dev(div4, "id", "modal" + /*i*/ ctx[3]);
    			attr_dev(div4, "tabindex", "-1");
    			attr_dev(div4, "role", "dialog");
    			attr_dev(div4, "aria-labelledby", "myModalLabel");
    			attr_dev(div4, "aria-hidden", "true");
    			add_location(div4, file$3, 26, 4, 633);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, a);
    			append_dev(a, img0);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, img1);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*images*/ 1 && img0.src !== (img0_src_value = /*image*/ ctx[1])) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			if (dirty & /*images*/ 1 && img1.src !== (img1_src_value = /*image*/ ctx[1])) {
    				attr_dev(img1, "src", img1_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(6:2) {#each images as image, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let each_value = /*images*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "row");
    			add_location(div, file$3, 4, 0, 46);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*images*/ 1) {
    				each_value = /*images*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
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

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ImageHeader", slots, []);
    	let { images = [] } = $$props;
    	const writable_props = ["images"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImageHeader> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("images" in $$props) $$invalidate(0, images = $$props.images);
    	};

    	$$self.$capture_state = () => ({ images });

    	$$self.$inject_state = $$props => {
    		if ("images" in $$props) $$invalidate(0, images = $$props.images);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [images];
    }

    class ImageHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { images: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageHeader",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get images() {
    		throw new Error("<ImageHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set images(value) {
    		throw new Error("<ImageHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/Viewer.svelte generated by Svelte v3.38.2 */
    const file$2 = "src/routes/Viewer.svelte";

    function create_fragment$4(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let imageheader;
    	let updating_images;
    	let t0;
    	let div2;
    	let div1;
    	let span0;
    	let t2;
    	let span1;
    	let t4;
    	let span2;
    	let t6;
    	let span3;
    	let t8;
    	let span4;
    	let t10;
    	let span5;
    	let t12;
    	let div29;
    	let table;
    	let thead;
    	let tr0;
    	let th;
    	let h1;
    	let u;
    	let t14;
    	let tbody;
    	let tr1;
    	let td0;
    	let t16;
    	let td1;
    	let div5;
    	let input0;
    	let t17;
    	let tr2;
    	let td2;
    	let hr0;
    	let t18;
    	let tr3;
    	let td3;
    	let t20;
    	let td4;
    	let div6;
    	let input1;
    	let t21;
    	let tr4;
    	let td5;
    	let hr1;
    	let t22;
    	let tr5;
    	let td6;
    	let t23;
    	let small;
    	let t25;
    	let td7;
    	let div7;
    	let input2;
    	let t26;
    	let tr6;
    	let td8;
    	let hr2;
    	let t27;
    	let tr7;
    	let td9;
    	let t29;
    	let td10;
    	let t30;
    	let tr8;
    	let td11;
    	let div9;
    	let div8;
    	let input3;
    	let t31;
    	let label0;
    	let t33;
    	let input4;
    	let t34;
    	let label1;
    	let t36;
    	let tr9;
    	let td12;
    	let hr3;
    	let t37;
    	let tr10;
    	let td13;
    	let t39;
    	let td14;
    	let div10;
    	let input5;
    	let t40;
    	let tr11;
    	let td15;
    	let t41;
    	let td16;
    	let div12;
    	let div11;
    	let input6;
    	let t42;
    	let span6;
    	let t44;
    	let tr12;
    	let td17;
    	let hr4;
    	let t45;
    	let tr13;
    	let td18;
    	let t47;
    	let td19;
    	let div13;
    	let input7;
    	let t48;
    	let tr14;
    	let td20;
    	let t49;
    	let td21;
    	let div15;
    	let div14;
    	let input8;
    	let t50;
    	let span7;
    	let t52;
    	let tr15;
    	let td22;
    	let hr5;
    	let t53;
    	let tr16;
    	let td23;
    	let t55;
    	let td24;
    	let div16;
    	let input9;
    	let t56;
    	let tr17;
    	let td25;
    	let hr6;
    	let t57;
    	let tr18;
    	let td26;
    	let t59;
    	let td27;
    	let div17;
    	let input10;
    	let t60;
    	let tr19;
    	let td28;
    	let hr7;
    	let t61;
    	let tr20;
    	let td29;
    	let t63;
    	let td30;
    	let div18;
    	let input11;
    	let t64;
    	let tr21;
    	let td31;
    	let t65;
    	let td32;
    	let div20;
    	let div19;
    	let input12;
    	let t66;
    	let span8;
    	let t68;
    	let tr22;
    	let td33;
    	let hr8;
    	let t69;
    	let tr23;
    	let td34;
    	let t71;
    	let td35;
    	let div21;
    	let input13;
    	let t72;
    	let tr24;
    	let td36;
    	let t73;
    	let td37;
    	let div23;
    	let div22;
    	let input14;
    	let t74;
    	let span9;
    	let t76;
    	let tr25;
    	let td38;
    	let hr9;
    	let t77;
    	let tr26;
    	let td39;
    	let t79;
    	let td40;
    	let div24;
    	let input15;
    	let t80;
    	let tr27;
    	let td41;
    	let hr10;
    	let t81;
    	let tr28;
    	let td42;
    	let t83;
    	let td43;
    	let div25;
    	let input16;
    	let t84;
    	let tr29;
    	let td44;
    	let hr11;
    	let t85;
    	let tr30;
    	let td45;
    	let t87;
    	let td46;
    	let div26;
    	let input17;
    	let t88;
    	let tr31;
    	let td47;
    	let hr12;
    	let t89;
    	let tr32;
    	let td48;
    	let t91;
    	let td49;
    	let div27;
    	let input18;
    	let t92;
    	let tr33;
    	let td50;
    	let hr13;
    	let t93;
    	let tr34;
    	let td51;
    	let t95;
    	let td52;
    	let div28;
    	let input19;
    	let t96;
    	let tr35;
    	let td53;
    	let button0;
    	let t98;
    	let tr36;
    	let td54;
    	let button1;
    	let current;

    	function imageheader_images_binding(value) {
    		/*imageheader_images_binding*/ ctx[1](value);
    	}

    	let imageheader_props = {};

    	if (/*images*/ ctx[0] !== void 0) {
    		imageheader_props.images = /*images*/ ctx[0];
    	}

    	imageheader = new ImageHeader({ props: imageheader_props, $$inline: true });
    	binding_callbacks.push(() => bind(imageheader, "images", imageheader_images_binding));

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			create_component(imageheader.$$.fragment);
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			span0 = element("span");
    			span0.textContent = "2in1";
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "아파트";
    			t4 = space();
    			span2 = element("span");
    			span2.textContent = "3층";
    			t6 = space();
    			span3 = element("span");
    			span3.textContent = "2in1";
    			t8 = space();
    			span4 = element("span");
    			span4.textContent = "매립배관 O";
    			t10 = space();
    			span5 = element("span");
    			span5.textContent = "철거 안함";
    			t12 = space();
    			div29 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th = element("th");
    			h1 = element("h1");
    			u = element("u");
    			u.textContent = "Checklist";
    			t14 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "앵글";
    			t16 = space();
    			td1 = element("td");
    			div5 = element("div");
    			input0 = element("input");
    			t17 = space();
    			tr2 = element("tr");
    			td2 = element("td");
    			hr0 = element("hr");
    			t18 = space();
    			tr3 = element("tr");
    			td3 = element("td");
    			td3.textContent = "실외기 받침대";
    			t20 = space();
    			td4 = element("td");
    			div6 = element("div");
    			input1 = element("input");
    			t21 = space();
    			tr4 = element("tr");
    			td5 = element("td");
    			hr1 = element("hr");
    			t22 = space();
    			tr5 = element("tr");
    			td6 = element("td");
    			t23 = text("실외기 고정");
    			small = element("small");
    			small.textContent = "(컷팅반도)";
    			t25 = space();
    			td7 = element("td");
    			div7 = element("div");
    			input2 = element("input");
    			t26 = space();
    			tr6 = element("tr");
    			td8 = element("td");
    			hr2 = element("hr");
    			t27 = space();
    			tr7 = element("tr");
    			td9 = element("td");
    			td9.textContent = "배관종류";
    			t29 = space();
    			td10 = element("td");
    			t30 = space();
    			tr8 = element("tr");
    			td11 = element("td");
    			div9 = element("div");
    			div8 = element("div");
    			input3 = element("input");
    			t31 = space();
    			label0 = element("label");
    			label0.textContent = "동";
    			t33 = space();
    			input4 = element("input");
    			t34 = space();
    			label1 = element("label");
    			label1.textContent = "알루미늄";
    			t36 = space();
    			tr9 = element("tr");
    			td12 = element("td");
    			hr3 = element("hr");
    			t37 = space();
    			tr10 = element("tr");
    			td13 = element("td");
    			td13.textContent = "배관 연장";
    			t39 = space();
    			td14 = element("td");
    			div10 = element("div");
    			input5 = element("input");
    			t40 = space();
    			tr11 = element("tr");
    			td15 = element("td");
    			t41 = space();
    			td16 = element("td");
    			div12 = element("div");
    			div11 = element("div");
    			input6 = element("input");
    			t42 = space();
    			span6 = element("span");
    			span6.textContent = "m";
    			t44 = space();
    			tr12 = element("tr");
    			td17 = element("td");
    			hr4 = element("hr");
    			t45 = space();
    			tr13 = element("tr");
    			td18 = element("td");
    			td18.textContent = "주름 배관";
    			t47 = space();
    			td19 = element("td");
    			div13 = element("div");
    			input7 = element("input");
    			t48 = space();
    			tr14 = element("tr");
    			td20 = element("td");
    			t49 = space();
    			td21 = element("td");
    			div15 = element("div");
    			div14 = element("div");
    			input8 = element("input");
    			t50 = space();
    			span7 = element("span");
    			span7.textContent = "m";
    			t52 = space();
    			tr15 = element("tr");
    			td22 = element("td");
    			hr5 = element("hr");
    			t53 = space();
    			tr16 = element("tr");
    			td23 = element("td");
    			td23.textContent = "배관 용접";
    			t55 = space();
    			td24 = element("td");
    			div16 = element("div");
    			input9 = element("input");
    			t56 = space();
    			tr17 = element("tr");
    			td25 = element("td");
    			hr6 = element("hr");
    			t57 = space();
    			tr18 = element("tr");
    			td26 = element("td");
    			td26.textContent = "냉매 주입";
    			t59 = space();
    			td27 = element("td");
    			div17 = element("div");
    			input10 = element("input");
    			t60 = space();
    			tr19 = element("tr");
    			td28 = element("td");
    			hr7 = element("hr");
    			t61 = space();
    			tr20 = element("tr");
    			td29 = element("td");
    			td29.textContent = "배수 펌프";
    			t63 = space();
    			td30 = element("td");
    			div18 = element("div");
    			input11 = element("input");
    			t64 = space();
    			tr21 = element("tr");
    			td31 = element("td");
    			t65 = space();
    			td32 = element("td");
    			div20 = element("div");
    			div19 = element("div");
    			input12 = element("input");
    			t66 = space();
    			span8 = element("span");
    			span8.textContent = "m";
    			t68 = space();
    			tr22 = element("tr");
    			td33 = element("td");
    			hr8 = element("hr");
    			t69 = space();
    			tr23 = element("tr");
    			td34 = element("td");
    			td34.textContent = "추가 타공";
    			t71 = space();
    			td35 = element("td");
    			div21 = element("div");
    			input13 = element("input");
    			t72 = space();
    			tr24 = element("tr");
    			td36 = element("td");
    			t73 = space();
    			td37 = element("td");
    			div23 = element("div");
    			div22 = element("div");
    			input14 = element("input");
    			t74 = space();
    			span9 = element("span");
    			span9.textContent = "회";
    			t76 = space();
    			tr25 = element("tr");
    			td38 = element("td");
    			hr9 = element("hr");
    			t77 = space();
    			tr26 = element("tr");
    			td39 = element("td");
    			td39.textContent = "실외기 위험수당";
    			t79 = space();
    			td40 = element("td");
    			div24 = element("div");
    			input15 = element("input");
    			t80 = space();
    			tr27 = element("tr");
    			td41 = element("td");
    			hr10 = element("hr");
    			t81 = space();
    			tr28 = element("tr");
    			td42 = element("td");
    			td42.textContent = "실외기 배수 Kit";
    			t83 = space();
    			td43 = element("td");
    			div25 = element("div");
    			input16 = element("input");
    			t84 = space();
    			tr29 = element("tr");
    			td44 = element("td");
    			hr11 = element("hr");
    			t85 = space();
    			tr30 = element("tr");
    			td45 = element("td");
    			td45.textContent = "유니온";
    			t87 = space();
    			td46 = element("td");
    			div26 = element("div");
    			input17 = element("input");
    			t88 = space();
    			tr31 = element("tr");
    			td47 = element("td");
    			hr12 = element("hr");
    			t89 = space();
    			tr32 = element("tr");
    			td48 = element("td");
    			td48.textContent = "전원선";
    			t91 = space();
    			td49 = element("td");
    			div27 = element("div");
    			input18 = element("input");
    			t92 = space();
    			tr33 = element("tr");
    			td50 = element("td");
    			hr13 = element("hr");
    			t93 = space();
    			tr34 = element("tr");
    			td51 = element("td");
    			td51.textContent = "실외기 에어가이드";
    			t95 = space();
    			td52 = element("td");
    			div28 = element("div");
    			input19 = element("input");
    			t96 = space();
    			tr35 = element("tr");
    			td53 = element("td");
    			button0 = element("button");
    			button0.textContent = "완료";
    			t98 = space();
    			tr36 = element("tr");
    			td54 = element("td");
    			button1 = element("button");
    			button1.textContent = "뒤로가기";
    			attr_dev(div0, "class", "row");
    			add_location(div0, file$2, 11, 4, 414);
    			attr_dev(span0, "class", "badge bg-dark rounded-pill");
    			add_location(span0, file$2, 16, 8, 531);
    			attr_dev(span1, "class", "badge bg-dark rounded-pill");
    			add_location(span1, file$2, 17, 8, 592);
    			attr_dev(span2, "class", "badge bg-dark rounded-pill");
    			add_location(span2, file$2, 18, 8, 652);
    			attr_dev(span3, "class", "badge bg-dark rounded-pill");
    			add_location(span3, file$2, 19, 8, 711);
    			attr_dev(span4, "class", "badge bg-dark rounded-pill");
    			add_location(span4, file$2, 20, 8, 772);
    			attr_dev(span5, "class", "badge bg-dark rounded-pill");
    			add_location(span5, file$2, 21, 8, 835);
    			attr_dev(div1, "class", "col");
    			add_location(div1, file$2, 15, 6, 505);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$2, 14, 4, 481);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file$2, 10, 2, 386);
    			attr_dev(div4, "class", "container-fluid bg-light shadow-sm");
    			add_location(div4, file$2, 9, 0, 335);
    			add_location(u, file$2, 31, 27, 1083);
    			attr_dev(h1, "class", "my-4");
    			add_location(h1, file$2, 31, 10, 1066);
    			attr_dev(th, "colspan", "2");
    			add_location(th, file$2, 30, 8, 1039);
    			add_location(tr0, file$2, 29, 6, 1026);
    			add_location(thead, file$2, 28, 4, 1012);
    			add_location(td0, file$2, 37, 8, 1175);
    			attr_dev(input0, "class", "form-check-input");
    			attr_dev(input0, "type", "checkbox");
    			input0.value = "";
    			add_location(input0, file$2, 40, 12, 1283);
    			attr_dev(div5, "class", "form-check d-flex justify-content-end");
    			add_location(div5, file$2, 39, 10, 1219);
    			attr_dev(td1, "class", "");
    			add_location(td1, file$2, 38, 8, 1195);
    			add_location(tr1, file$2, 36, 6, 1162);
    			add_location(hr0, file$2, 45, 24, 1421);
    			attr_dev(td2, "colspan", "2");
    			add_location(td2, file$2, 45, 8, 1405);
    			add_location(tr2, file$2, 44, 6, 1392);
    			add_location(td3, file$2, 49, 8, 1465);
    			attr_dev(input1, "class", "form-check-input");
    			attr_dev(input1, "type", "checkbox");
    			input1.value = "";
    			add_location(input1, file$2, 52, 12, 1569);
    			attr_dev(div6, "class", "form-check d-flex justify-content-end");
    			add_location(div6, file$2, 51, 10, 1505);
    			add_location(td4, file$2, 50, 8, 1490);
    			add_location(tr3, file$2, 48, 6, 1452);
    			add_location(hr1, file$2, 58, 24, 1708);
    			attr_dev(td5, "colspan", "2");
    			add_location(td5, file$2, 58, 8, 1692);
    			add_location(tr4, file$2, 57, 6, 1679);
    			add_location(small, file$2, 61, 18, 1761);
    			add_location(td6, file$2, 61, 8, 1751);
    			attr_dev(input2, "class", "form-check-input");
    			attr_dev(input2, "type", "checkbox");
    			input2.value = "";
    			add_location(input2, file$2, 64, 12, 1875);
    			attr_dev(div7, "class", "form-check d-flex justify-content-end");
    			add_location(div7, file$2, 63, 10, 1811);
    			add_location(td7, file$2, 62, 8, 1796);
    			add_location(tr5, file$2, 60, 6, 1738);
    			add_location(hr2, file$2, 70, 24, 2014);
    			attr_dev(td8, "colspan", "2");
    			add_location(td8, file$2, 70, 8, 1998);
    			add_location(tr6, file$2, 69, 6, 1985);
    			add_location(td9, file$2, 73, 8, 2057);
    			add_location(td10, file$2, 74, 8, 2079);
    			add_location(tr7, file$2, 72, 6, 2044);
    			attr_dev(input3, "type", "radio");
    			attr_dev(input3, "class", "btn-check");
    			attr_dev(input3, "name", "pipetype");
    			attr_dev(input3, "id", "pipetype1");
    			attr_dev(input3, "autocomplete", "off");
    			add_location(input3, file$2, 80, 14, 2235);
    			attr_dev(label0, "class", "btn btn-light");
    			attr_dev(label0, "for", "pipetype1");
    			add_location(label0, file$2, 87, 14, 2434);
    			attr_dev(input4, "type", "radio");
    			attr_dev(input4, "class", "btn-check");
    			attr_dev(input4, "name", "pipetype");
    			attr_dev(input4, "id", "pipetype2");
    			attr_dev(input4, "autocomplete", "off");
    			add_location(input4, file$2, 89, 14, 2504);
    			attr_dev(label1, "class", "btn btn-light");
    			attr_dev(label1, "for", "pipetype2");
    			add_location(label1, file$2, 96, 14, 2703);
    			attr_dev(div8, "class", "btn-group");
    			add_location(div8, file$2, 79, 12, 2197);
    			attr_dev(div9, "class", "d-flex justify-content-end");
    			add_location(div9, file$2, 78, 10, 2144);
    			attr_dev(td11, "colspan", "2");
    			add_location(td11, file$2, 77, 8, 2117);
    			add_location(tr8, file$2, 76, 6, 2104);
    			add_location(hr3, file$2, 103, 24, 2859);
    			attr_dev(td12, "colspan", "2");
    			add_location(td12, file$2, 103, 8, 2843);
    			add_location(tr9, file$2, 102, 6, 2830);
    			add_location(td13, file$2, 106, 8, 2902);
    			attr_dev(input5, "class", "form-check-input");
    			attr_dev(input5, "type", "checkbox");
    			input5.value = "";
    			add_location(input5, file$2, 109, 12, 3004);
    			attr_dev(div10, "class", "form-check d-flex justify-content-end");
    			add_location(div10, file$2, 108, 10, 2940);
    			add_location(td14, file$2, 107, 8, 2925);
    			add_location(tr10, file$2, 105, 6, 2889);
    			add_location(td15, file$2, 114, 8, 3126);
    			attr_dev(input6, "type", "text");
    			attr_dev(input6, "class", "form-control");
    			attr_dev(input6, "placeholder", "연장 길이");
    			attr_dev(input6, "aria-label", "연장 길이");
    			attr_dev(input6, "aria-describedby", "pipelength");
    			add_location(input6, file$2, 118, 14, 3267);
    			attr_dev(span6, "class", "input-group-text");
    			attr_dev(span6, "id", "pipelength");
    			add_location(span6, file$2, 125, 14, 3487);
    			attr_dev(div11, "class", "input-group input-group-sm");
    			add_location(div11, file$2, 117, 12, 3212);
    			attr_dev(div12, "class", "d-flex justify-content-center");
    			add_location(div12, file$2, 116, 10, 3156);
    			add_location(td16, file$2, 115, 8, 3141);
    			add_location(tr11, file$2, 113, 6, 3113);
    			add_location(hr4, file$2, 131, 24, 3642);
    			attr_dev(td17, "colspan", "2");
    			add_location(td17, file$2, 131, 8, 3626);
    			add_location(tr12, file$2, 130, 6, 3613);
    			add_location(td18, file$2, 134, 8, 3685);
    			attr_dev(input7, "class", "form-check-input");
    			attr_dev(input7, "type", "checkbox");
    			input7.value = "";
    			add_location(input7, file$2, 137, 12, 3787);
    			attr_dev(div13, "class", "form-check d-flex justify-content-end");
    			add_location(div13, file$2, 136, 10, 3723);
    			add_location(td19, file$2, 135, 8, 3708);
    			add_location(tr13, file$2, 133, 6, 3672);
    			add_location(td20, file$2, 142, 8, 3909);
    			attr_dev(input8, "type", "text");
    			attr_dev(input8, "class", "form-control");
    			attr_dev(input8, "placeholder", "필요 길이");
    			attr_dev(input8, "aria-label", "필요 길이");
    			attr_dev(input8, "aria-describedby", "pipelength");
    			add_location(input8, file$2, 146, 14, 4050);
    			attr_dev(span7, "class", "input-group-text");
    			attr_dev(span7, "id", "pipelength");
    			add_location(span7, file$2, 153, 14, 4270);
    			attr_dev(div14, "class", "input-group input-group-sm");
    			add_location(div14, file$2, 145, 12, 3995);
    			attr_dev(div15, "class", "d-flex justify-content-center");
    			add_location(div15, file$2, 144, 10, 3939);
    			add_location(td21, file$2, 143, 8, 3924);
    			add_location(tr14, file$2, 141, 6, 3896);
    			add_location(hr5, file$2, 159, 24, 4425);
    			attr_dev(td22, "colspan", "2");
    			add_location(td22, file$2, 159, 8, 4409);
    			add_location(tr15, file$2, 158, 6, 4396);
    			add_location(td23, file$2, 162, 8, 4468);
    			attr_dev(input9, "class", "form-check-input");
    			attr_dev(input9, "type", "checkbox");
    			input9.value = "";
    			add_location(input9, file$2, 165, 12, 4570);
    			attr_dev(div16, "class", "form-check d-flex justify-content-end");
    			add_location(div16, file$2, 164, 10, 4506);
    			add_location(td24, file$2, 163, 8, 4491);
    			add_location(tr16, file$2, 161, 6, 4455);
    			add_location(hr6, file$2, 170, 24, 4708);
    			attr_dev(td25, "colspan", "2");
    			add_location(td25, file$2, 170, 8, 4692);
    			add_location(tr17, file$2, 169, 6, 4679);
    			add_location(td26, file$2, 173, 8, 4751);
    			attr_dev(input10, "class", "form-check-input");
    			attr_dev(input10, "type", "checkbox");
    			input10.value = "";
    			add_location(input10, file$2, 176, 12, 4853);
    			attr_dev(div17, "class", "form-check d-flex justify-content-end");
    			add_location(div17, file$2, 175, 10, 4789);
    			add_location(td27, file$2, 174, 8, 4774);
    			add_location(tr18, file$2, 172, 6, 4738);
    			add_location(hr7, file$2, 181, 24, 4991);
    			attr_dev(td28, "colspan", "2");
    			add_location(td28, file$2, 181, 8, 4975);
    			add_location(tr19, file$2, 180, 6, 4962);
    			add_location(td29, file$2, 184, 8, 5034);
    			attr_dev(input11, "class", "form-check-input");
    			attr_dev(input11, "type", "checkbox");
    			input11.value = "";
    			add_location(input11, file$2, 187, 12, 5136);
    			attr_dev(div18, "class", "form-check d-flex justify-content-end");
    			add_location(div18, file$2, 186, 10, 5072);
    			add_location(td30, file$2, 185, 8, 5057);
    			add_location(tr20, file$2, 183, 6, 5021);
    			add_location(td31, file$2, 192, 8, 5258);
    			attr_dev(input12, "type", "text");
    			attr_dev(input12, "class", "form-control");
    			attr_dev(input12, "placeholder", "배관 길이");
    			attr_dev(input12, "aria-label", "배관 길이");
    			attr_dev(input12, "aria-describedby", "pipelength");
    			add_location(input12, file$2, 196, 14, 5399);
    			attr_dev(span8, "class", "input-group-text");
    			attr_dev(span8, "id", "pipelength");
    			add_location(span8, file$2, 203, 14, 5619);
    			attr_dev(div19, "class", "input-group input-group-sm");
    			add_location(div19, file$2, 195, 12, 5344);
    			attr_dev(div20, "class", "d-flex justify-content-center");
    			add_location(div20, file$2, 194, 10, 5288);
    			add_location(td32, file$2, 193, 8, 5273);
    			add_location(tr21, file$2, 191, 6, 5245);
    			add_location(hr8, file$2, 210, 24, 5775);
    			attr_dev(td33, "colspan", "2");
    			add_location(td33, file$2, 210, 8, 5759);
    			add_location(tr22, file$2, 209, 6, 5746);
    			add_location(td34, file$2, 213, 8, 5818);
    			attr_dev(input13, "class", "form-check-input");
    			attr_dev(input13, "type", "checkbox");
    			input13.value = "";
    			add_location(input13, file$2, 216, 12, 5920);
    			attr_dev(div21, "class", "form-check d-flex justify-content-end");
    			add_location(div21, file$2, 215, 10, 5856);
    			add_location(td35, file$2, 214, 8, 5841);
    			add_location(tr23, file$2, 212, 6, 5805);
    			add_location(td36, file$2, 221, 8, 6042);
    			attr_dev(input14, "type", "text");
    			attr_dev(input14, "class", "form-control");
    			attr_dev(input14, "placeholder", "타공 횟수");
    			attr_dev(input14, "aria-label", "타공 횟수");
    			attr_dev(input14, "aria-describedby", "pipelength");
    			add_location(input14, file$2, 225, 14, 6183);
    			attr_dev(span9, "class", "input-group-text");
    			attr_dev(span9, "id", "pipelength");
    			add_location(span9, file$2, 232, 14, 6403);
    			attr_dev(div22, "class", "input-group input-group-sm");
    			add_location(div22, file$2, 224, 12, 6128);
    			attr_dev(div23, "class", "d-flex justify-content-center");
    			add_location(div23, file$2, 223, 10, 6072);
    			add_location(td37, file$2, 222, 8, 6057);
    			add_location(tr24, file$2, 220, 6, 6029);
    			add_location(hr9, file$2, 238, 24, 6558);
    			attr_dev(td38, "colspan", "2");
    			add_location(td38, file$2, 238, 8, 6542);
    			add_location(tr25, file$2, 237, 6, 6529);
    			add_location(td39, file$2, 241, 8, 6601);
    			attr_dev(input15, "class", "form-check-input");
    			attr_dev(input15, "type", "checkbox");
    			input15.value = "";
    			add_location(input15, file$2, 244, 12, 6706);
    			attr_dev(div24, "class", "form-check d-flex justify-content-end");
    			add_location(div24, file$2, 243, 10, 6642);
    			add_location(td40, file$2, 242, 8, 6627);
    			add_location(tr26, file$2, 240, 6, 6588);
    			add_location(hr10, file$2, 249, 24, 6844);
    			attr_dev(td41, "colspan", "2");
    			add_location(td41, file$2, 249, 8, 6828);
    			add_location(tr27, file$2, 248, 6, 6815);
    			add_location(td42, file$2, 252, 8, 6887);
    			attr_dev(input16, "class", "form-check-input");
    			attr_dev(input16, "type", "checkbox");
    			input16.value = "";
    			add_location(input16, file$2, 255, 12, 6994);
    			attr_dev(div25, "class", "form-check d-flex justify-content-end");
    			add_location(div25, file$2, 254, 10, 6930);
    			add_location(td43, file$2, 253, 8, 6915);
    			add_location(tr28, file$2, 251, 6, 6874);
    			add_location(hr11, file$2, 260, 24, 7132);
    			attr_dev(td44, "colspan", "2");
    			add_location(td44, file$2, 260, 8, 7116);
    			add_location(tr29, file$2, 259, 6, 7103);
    			add_location(td45, file$2, 263, 8, 7175);
    			attr_dev(input17, "class", "form-check-input");
    			attr_dev(input17, "type", "checkbox");
    			input17.value = "";
    			add_location(input17, file$2, 266, 12, 7275);
    			attr_dev(div26, "class", "form-check d-flex justify-content-end");
    			add_location(div26, file$2, 265, 10, 7211);
    			add_location(td46, file$2, 264, 8, 7196);
    			add_location(tr30, file$2, 262, 6, 7162);
    			add_location(hr12, file$2, 271, 24, 7413);
    			attr_dev(td47, "colspan", "2");
    			add_location(td47, file$2, 271, 8, 7397);
    			add_location(tr31, file$2, 270, 6, 7384);
    			add_location(td48, file$2, 274, 8, 7456);
    			attr_dev(input18, "class", "form-check-input");
    			attr_dev(input18, "type", "checkbox");
    			input18.value = "";
    			add_location(input18, file$2, 277, 12, 7556);
    			attr_dev(div27, "class", "form-check d-flex justify-content-end");
    			add_location(div27, file$2, 276, 10, 7492);
    			add_location(td49, file$2, 275, 8, 7477);
    			add_location(tr32, file$2, 273, 6, 7443);
    			add_location(hr13, file$2, 282, 24, 7694);
    			attr_dev(td50, "colspan", "2");
    			add_location(td50, file$2, 282, 8, 7678);
    			add_location(tr33, file$2, 281, 6, 7665);
    			add_location(td51, file$2, 285, 8, 7737);
    			attr_dev(input19, "class", "form-check-input");
    			attr_dev(input19, "type", "checkbox");
    			input19.value = "";
    			add_location(input19, file$2, 288, 12, 7843);
    			attr_dev(div28, "class", "form-check d-flex justify-content-end");
    			add_location(div28, file$2, 287, 10, 7779);
    			add_location(td52, file$2, 286, 8, 7764);
    			add_location(tr34, file$2, 284, 6, 7724);
    			attr_dev(button0, "class", "btn btn-success btn-lg w-100 mt-5 mb-0");
    			add_location(button0, file$2, 295, 10, 7993);
    			attr_dev(td53, "colspan", "2");
    			add_location(td53, file$2, 294, 8, 7966);
    			add_location(tr35, file$2, 293, 6, 7953);
    			attr_dev(button1, "class", "btn btn-light w-100 m-0");
    			add_location(button1, file$2, 300, 10, 8132);
    			attr_dev(td54, "colspan", "2");
    			add_location(td54, file$2, 299, 8, 8105);
    			add_location(tr36, file$2, 298, 6, 8092);
    			add_location(tbody, file$2, 35, 4, 1148);
    			attr_dev(table, "class", "table table-borderless table-sm");
    			add_location(table, file$2, 27, 2, 960);
    			attr_dev(div29, "class", "container py-3");
    			add_location(div29, file$2, 26, 0, 929);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			mount_component(imageheader, div0, null);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, span0);
    			append_dev(div1, t2);
    			append_dev(div1, span1);
    			append_dev(div1, t4);
    			append_dev(div1, span2);
    			append_dev(div1, t6);
    			append_dev(div1, span3);
    			append_dev(div1, t8);
    			append_dev(div1, span4);
    			append_dev(div1, t10);
    			append_dev(div1, span5);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, div29, anchor);
    			append_dev(div29, table);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th);
    			append_dev(th, h1);
    			append_dev(h1, u);
    			append_dev(table, t14);
    			append_dev(table, tbody);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t16);
    			append_dev(tr1, td1);
    			append_dev(td1, div5);
    			append_dev(div5, input0);
    			append_dev(tbody, t17);
    			append_dev(tbody, tr2);
    			append_dev(tr2, td2);
    			append_dev(td2, hr0);
    			append_dev(tbody, t18);
    			append_dev(tbody, tr3);
    			append_dev(tr3, td3);
    			append_dev(tr3, t20);
    			append_dev(tr3, td4);
    			append_dev(td4, div6);
    			append_dev(div6, input1);
    			append_dev(tbody, t21);
    			append_dev(tbody, tr4);
    			append_dev(tr4, td5);
    			append_dev(td5, hr1);
    			append_dev(tbody, t22);
    			append_dev(tbody, tr5);
    			append_dev(tr5, td6);
    			append_dev(td6, t23);
    			append_dev(td6, small);
    			append_dev(tr5, t25);
    			append_dev(tr5, td7);
    			append_dev(td7, div7);
    			append_dev(div7, input2);
    			append_dev(tbody, t26);
    			append_dev(tbody, tr6);
    			append_dev(tr6, td8);
    			append_dev(td8, hr2);
    			append_dev(tbody, t27);
    			append_dev(tbody, tr7);
    			append_dev(tr7, td9);
    			append_dev(tr7, t29);
    			append_dev(tr7, td10);
    			append_dev(tbody, t30);
    			append_dev(tbody, tr8);
    			append_dev(tr8, td11);
    			append_dev(td11, div9);
    			append_dev(div9, div8);
    			append_dev(div8, input3);
    			append_dev(div8, t31);
    			append_dev(div8, label0);
    			append_dev(div8, t33);
    			append_dev(div8, input4);
    			append_dev(div8, t34);
    			append_dev(div8, label1);
    			append_dev(tbody, t36);
    			append_dev(tbody, tr9);
    			append_dev(tr9, td12);
    			append_dev(td12, hr3);
    			append_dev(tbody, t37);
    			append_dev(tbody, tr10);
    			append_dev(tr10, td13);
    			append_dev(tr10, t39);
    			append_dev(tr10, td14);
    			append_dev(td14, div10);
    			append_dev(div10, input5);
    			append_dev(tbody, t40);
    			append_dev(tbody, tr11);
    			append_dev(tr11, td15);
    			append_dev(tr11, t41);
    			append_dev(tr11, td16);
    			append_dev(td16, div12);
    			append_dev(div12, div11);
    			append_dev(div11, input6);
    			append_dev(div11, t42);
    			append_dev(div11, span6);
    			append_dev(tbody, t44);
    			append_dev(tbody, tr12);
    			append_dev(tr12, td17);
    			append_dev(td17, hr4);
    			append_dev(tbody, t45);
    			append_dev(tbody, tr13);
    			append_dev(tr13, td18);
    			append_dev(tr13, t47);
    			append_dev(tr13, td19);
    			append_dev(td19, div13);
    			append_dev(div13, input7);
    			append_dev(tbody, t48);
    			append_dev(tbody, tr14);
    			append_dev(tr14, td20);
    			append_dev(tr14, t49);
    			append_dev(tr14, td21);
    			append_dev(td21, div15);
    			append_dev(div15, div14);
    			append_dev(div14, input8);
    			append_dev(div14, t50);
    			append_dev(div14, span7);
    			append_dev(tbody, t52);
    			append_dev(tbody, tr15);
    			append_dev(tr15, td22);
    			append_dev(td22, hr5);
    			append_dev(tbody, t53);
    			append_dev(tbody, tr16);
    			append_dev(tr16, td23);
    			append_dev(tr16, t55);
    			append_dev(tr16, td24);
    			append_dev(td24, div16);
    			append_dev(div16, input9);
    			append_dev(tbody, t56);
    			append_dev(tbody, tr17);
    			append_dev(tr17, td25);
    			append_dev(td25, hr6);
    			append_dev(tbody, t57);
    			append_dev(tbody, tr18);
    			append_dev(tr18, td26);
    			append_dev(tr18, t59);
    			append_dev(tr18, td27);
    			append_dev(td27, div17);
    			append_dev(div17, input10);
    			append_dev(tbody, t60);
    			append_dev(tbody, tr19);
    			append_dev(tr19, td28);
    			append_dev(td28, hr7);
    			append_dev(tbody, t61);
    			append_dev(tbody, tr20);
    			append_dev(tr20, td29);
    			append_dev(tr20, t63);
    			append_dev(tr20, td30);
    			append_dev(td30, div18);
    			append_dev(div18, input11);
    			append_dev(tbody, t64);
    			append_dev(tbody, tr21);
    			append_dev(tr21, td31);
    			append_dev(tr21, t65);
    			append_dev(tr21, td32);
    			append_dev(td32, div20);
    			append_dev(div20, div19);
    			append_dev(div19, input12);
    			append_dev(div19, t66);
    			append_dev(div19, span8);
    			append_dev(tbody, t68);
    			append_dev(tbody, tr22);
    			append_dev(tr22, td33);
    			append_dev(td33, hr8);
    			append_dev(tbody, t69);
    			append_dev(tbody, tr23);
    			append_dev(tr23, td34);
    			append_dev(tr23, t71);
    			append_dev(tr23, td35);
    			append_dev(td35, div21);
    			append_dev(div21, input13);
    			append_dev(tbody, t72);
    			append_dev(tbody, tr24);
    			append_dev(tr24, td36);
    			append_dev(tr24, t73);
    			append_dev(tr24, td37);
    			append_dev(td37, div23);
    			append_dev(div23, div22);
    			append_dev(div22, input14);
    			append_dev(div22, t74);
    			append_dev(div22, span9);
    			append_dev(tbody, t76);
    			append_dev(tbody, tr25);
    			append_dev(tr25, td38);
    			append_dev(td38, hr9);
    			append_dev(tbody, t77);
    			append_dev(tbody, tr26);
    			append_dev(tr26, td39);
    			append_dev(tr26, t79);
    			append_dev(tr26, td40);
    			append_dev(td40, div24);
    			append_dev(div24, input15);
    			append_dev(tbody, t80);
    			append_dev(tbody, tr27);
    			append_dev(tr27, td41);
    			append_dev(td41, hr10);
    			append_dev(tbody, t81);
    			append_dev(tbody, tr28);
    			append_dev(tr28, td42);
    			append_dev(tr28, t83);
    			append_dev(tr28, td43);
    			append_dev(td43, div25);
    			append_dev(div25, input16);
    			append_dev(tbody, t84);
    			append_dev(tbody, tr29);
    			append_dev(tr29, td44);
    			append_dev(td44, hr11);
    			append_dev(tbody, t85);
    			append_dev(tbody, tr30);
    			append_dev(tr30, td45);
    			append_dev(tr30, t87);
    			append_dev(tr30, td46);
    			append_dev(td46, div26);
    			append_dev(div26, input17);
    			append_dev(tbody, t88);
    			append_dev(tbody, tr31);
    			append_dev(tr31, td47);
    			append_dev(td47, hr12);
    			append_dev(tbody, t89);
    			append_dev(tbody, tr32);
    			append_dev(tr32, td48);
    			append_dev(tr32, t91);
    			append_dev(tr32, td49);
    			append_dev(td49, div27);
    			append_dev(div27, input18);
    			append_dev(tbody, t92);
    			append_dev(tbody, tr33);
    			append_dev(tr33, td50);
    			append_dev(td50, hr13);
    			append_dev(tbody, t93);
    			append_dev(tbody, tr34);
    			append_dev(tr34, td51);
    			append_dev(tr34, t95);
    			append_dev(tr34, td52);
    			append_dev(td52, div28);
    			append_dev(div28, input19);
    			append_dev(tbody, t96);
    			append_dev(tbody, tr35);
    			append_dev(tr35, td53);
    			append_dev(td53, button0);
    			append_dev(tbody, t98);
    			append_dev(tbody, tr36);
    			append_dev(tr36, td54);
    			append_dev(td54, button1);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const imageheader_changes = {};

    			if (!updating_images && dirty & /*images*/ 1) {
    				updating_images = true;
    				imageheader_changes.images = /*images*/ ctx[0];
    				add_flush_callback(() => updating_images = false);
    			}

    			imageheader.$set(imageheader_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imageheader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imageheader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(imageheader);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(div29);
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
    	validate_slots("Viewer", slots, []);

    	let images = [
    		"https://i.ibb.co/qy4kPbc/Kakao-Talk-Photo-2021-07-02-16-28-03.jpg",
    		"https://i.ibb.co/Pwzrr0s/Kakao-Talk-Photo-2021-07-02-16-28-11.jpg",
    		"https://i.ibb.co/60HQJ3F/Kakao-Talk-Photo-2021-07-02-16-28-15.jpg"
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Viewer> was created with unknown prop '${key}'`);
    	});

    	function imageheader_images_binding(value) {
    		images = value;
    		$$invalidate(0, images);
    	}

    	$$self.$capture_state = () => ({ ImageHeader, images });

    	$$self.$inject_state = $$props => {
    		if ("images" in $$props) $$invalidate(0, images = $$props.images);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [images, imageheader_images_binding];
    }

    class Viewer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Viewer",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/routes/NotFound.svelte generated by Svelte v3.38.2 */

    const file$1 = "src/routes/NotFound.svelte";

    function create_fragment$3(ctx) {
    	let h1;
    	let t1;
    	let p;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Oops!";
    			t1 = space();
    			p = element("p");
    			p.textContent = "page not found";
    			add_location(h1, file$1, 3, 0, 20);
    			add_location(p, file$1, 4, 0, 35);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
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

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NotFound", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NotFound> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class NotFound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotFound",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/routes/Home.svelte generated by Svelte v3.38.2 */

    function create_fragment$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("It's home");
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
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

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const routes = {
        '/': Home,
        '/request': RequestForm,
        '/viewer': Viewer,
        '*': NotFound
    };

    // List of nodes to update
    const nodes = [];

    // Current location
    let location;

    // Function that updates all nodes marking the active ones
    function checkActive(el) {
        const matchesLocation = el.pattern.test(location);
        toggleClasses(el, el.className, matchesLocation);
        toggleClasses(el, el.inactiveClassName, !matchesLocation);
    }

    function toggleClasses(el, className, shouldAdd) {
        (className || '').split(' ').forEach((cls) => {
            if (!cls) {
                return
            }
            // Remove the class firsts
            el.node.classList.remove(cls);

            // If the pattern doesn't match, then set the class
            if (shouldAdd) {
                el.node.classList.add(cls);
            }
        });
    }

    // Listen to changes in the location
    loc.subscribe((value) => {
        // Update the location
        location = value.location + (value.querystring ? '?' + value.querystring : '');

        // Update all nodes
        nodes.map(checkActive);
    });

    /**
     * @typedef {Object} ActiveOptions
     * @property {string|RegExp} [path] - Path expression that makes the link active when matched (must start with '/' or '*'); default is the link's href
     * @property {string} [className] - CSS class to apply to the element when active; default value is "active"
     */

    /**
     * Svelte Action for automatically adding the "active" class to elements (links, or any other DOM element) when the current location matches a certain path.
     * 
     * @param {HTMLElement} node - The target node (automatically set by Svelte)
     * @param {ActiveOptions|string|RegExp} [opts] - Can be an object of type ActiveOptions, or a string (or regular expressions) representing ActiveOptions.path.
     * @returns {{destroy: function(): void}} Destroy function
     */
    function active(node, opts) {
        // Check options
        if (opts && (typeof opts == 'string' || (typeof opts == 'object' && opts instanceof RegExp))) {
            // Interpret strings and regular expressions as opts.path
            opts = {
                path: opts
            };
        }
        else {
            // Ensure opts is a dictionary
            opts = opts || {};
        }

        // Path defaults to link target
        if (!opts.path && node.hasAttribute('href')) {
            opts.path = node.getAttribute('href');
            if (opts.path && opts.path.length > 1 && opts.path.charAt(0) == '#') {
                opts.path = opts.path.substring(1);
            }
        }

        // Default class name
        if (!opts.className) {
            opts.className = 'active';
        }

        // If path is a string, it must start with '/' or '*'
        if (!opts.path || 
            typeof opts.path == 'string' && (opts.path.length < 1 || (opts.path.charAt(0) != '/' && opts.path.charAt(0) != '*'))
        ) {
            throw Error('Invalid value for "path" argument')
        }

        // If path is not a regular expression already, make it
        const {pattern} = typeof opts.path == 'string' ?
            parse(opts.path) :
            {pattern: opts.path};

        // Add the node to the list
        const el = {
            node,
            className: opts.className,
            inactiveClassName: opts.inactiveClassName,
            pattern
        };
        nodes.push(el);

        // Trigger the action right away
        checkActive(el);

        return {
            // When the element is destroyed, remove it from the list
            destroy() {
                nodes.splice(nodes.indexOf(el), 1);
            }
        }
    }

    /* src/Header.svelte generated by Svelte v3.38.2 */
    const file = "src/Header.svelte";

    function create_fragment$1(ctx) {
    	let a0;
    	let t1;
    	let a1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a0 = element("a");
    			a0.textContent = "home";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "request";
    			attr_dev(a0, "href", "/home");
    			add_location(a0, file, 5, 0, 113);
    			attr_dev(a1, "href", "/request");
    			add_location(a1, file, 6, 0, 158);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a1, anchor);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link.call(null, a0)),
    					action_destroyer(active.call(null, a0)),
    					action_destroyer(link.call(null, a1)),
    					action_destroyer(active.call(null, a1))
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a1);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ link, active });
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */

    function create_fragment(ctx) {
    	let router;
    	let current;
    	router = new Router({ props: { routes }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
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
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Router, routes, Header });
    	return [];
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
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
