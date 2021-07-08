
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
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
    function dataset_dev(node, property, value) {
        node.dataset[property] = value;
        dispatch_dev('SvelteDOMSetDataset', { node, property, value });
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
    function create_else_block$2(ctx) {
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
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(251:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:0) {#if componentParams}
    function create_if_block$4(ctx) {
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
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block$2];
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
    		id: create_fragment$b.name,
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

    function instance$b($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$b.name
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
    const file$8 = "src/components/ImagePicker/ImagePicker.svelte";

    function create_fragment$a(ctx) {
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
    			add_location(img, file$8, 52, 6, 1354);
    			attr_dev(div0, "class", "d-flex justify-content-center align-items-center h-100");
    			add_location(div0, file$8, 51, 4, 1279);
    			attr_dev(button0, "class", "btn btn-lg btn-floating btn-light");
    			button0.disabled = button0_disabled_value = !/*active*/ ctx[1];
    			toggle_class(button0, "d-none", /*isUploaded*/ ctx[0] || /*isUploading*/ ctx[3]);
    			add_location(button0, file$8, 64, 8, 1694);
    			attr_dev(span, "class", "visually-hidden");
    			add_location(span, file$8, 78, 10, 2075);
    			attr_dev(div1, "class", "spinner-border");
    			attr_dev(div1, "role", "status");
    			toggle_class(div1, "d-none", !/*isUploading*/ ctx[3]);
    			toggle_class(div1, "d-block", /*isUploading*/ ctx[3]);
    			add_location(div1, file$8, 72, 8, 1917);
    			attr_dev(div2, "class", "d-flex justify-content-center align-items-center h-100");
    			add_location(div2, file$8, 63, 6, 1617);
    			attr_dev(div3, "class", "mask");
    			set_style(div3, "background-color", "rgba(255,255,255," + /*maskOpacity*/ ctx[4] + ")");
    			toggle_class(div3, "d-none", /*isUploaded*/ ctx[0]);
    			add_location(div3, file$8, 58, 4, 1486);
    			attr_dev(button1, "class", "btn btn-danger btn-small btn-floating");
    			add_location(button1, file$8, 84, 8, 2279);
    			attr_dev(div4, "class", "d-flex justify-content-end h-100 p-2");
    			add_location(div4, file$8, 83, 6, 2220);
    			attr_dev(div5, "class", "mask");
    			toggle_class(div5, "d-none", !/*isUploaded*/ ctx[0]);
    			add_location(div5, file$8, 82, 4, 2168);
    			attr_dev(div6, "class", "bg-image h-100");
    			add_location(div6, file$8, 50, 2, 1246);
    			attr_dev(div7, "class", "card border square w-100 h-100 shadow-none");
    			attr_dev(div7, "id", "pickerCard");
    			add_location(div7, file$8, 49, 0, 1171);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { value: 7, active: 1, isUploaded: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImagePicker",
    			options,
    			id: create_fragment$a.name
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

    var apiHost="http://localhost:3000/api";

    const selectAll = async (tableName) => {
        const host = `${apiHost}/` + tableName;
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
        const host = `${apiHost}/insert_request`;

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

    const file$7 = "src/components/Alert.svelte";

    // (9:0) {#if showAlert}
    function create_if_block$3(ctx) {
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
    			add_location(span, file$7, 11, 6, 259);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn-close");
    			add_location(button, file$7, 12, 6, 288);
    			attr_dev(div0, "class", "d-flex justify-content-between align-items-center");
    			add_location(div0, file$7, 10, 4, 189);
    			attr_dev(div1, "class", "alert alert-danger");
    			add_location(div1, file$7, 9, 2, 152);
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(9:0) {#if showAlert}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let if_block = /*showAlert*/ ctx[0] && create_if_block$3(ctx);

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
    					if_block = create_if_block$3(ctx);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { message: 1, showAlert: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Alert",
    			options,
    			id: create_fragment$9.name
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

    const getTotalByStatus$1 = async (status) => {
        const host = `${apiHost}/get_total_by_status?status=` + status;
        console.log(host);
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

    /* src/components/ListHeader/ListHeader.svelte generated by Svelte v3.38.2 */
    const file$6 = "src/components/ListHeader/ListHeader.svelte";

    // (1:0) <script>   import { getTotalByStatus }
    function create_catch_block_3(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_3.name,
    		type: "catch",
    		source: "(1:0) <script>   import { getTotalByStatus }",
    		ctx
    	});

    	return block;
    }

    // (52:48)                {#if result.data.total}
    function create_then_block_3(ctx) {
    	let if_block_anchor;
    	let if_block = /*result*/ ctx[9].data.total && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*result*/ ctx[9].data.total) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block_3.name,
    		type: "then",
    		source: "(52:48)                {#if result.data.total}",
    		ctx
    	});

    	return block;
    }

    // (53:14) {#if result.data.total}
    function create_if_block_2(ctx) {
    	let span;
    	let t_value = /*result*/ ctx[9].data.total + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "badge bg-danger badge-notification rounded-pill text-dark");
    			add_location(span, file$6, 53, 16, 1469);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(53:14) {#if result.data.total}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { getTotalByStatus }
    function create_pending_block_3(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_3.name,
    		type: "pending",
    		source: "(1:0) <script>   import { getTotalByStatus }",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { getTotalByStatus }
    function create_catch_block_2$1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_2$1.name,
    		type: "catch",
    		source: "(1:0) <script>   import { getTotalByStatus }",
    		ctx
    	});

    	return block;
    }

    // (70:48)                {#if result.data.total}
    function create_then_block_2$1(ctx) {
    	let if_block_anchor;
    	let if_block = /*result*/ ctx[9].data.total && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*result*/ ctx[9].data.total) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block_2$1.name,
    		type: "then",
    		source: "(70:48)                {#if result.data.total}",
    		ctx
    	});

    	return block;
    }

    // (71:14) {#if result.data.total}
    function create_if_block_1$2(ctx) {
    	let span;
    	let t_value = /*result*/ ctx[9].data.total + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "badge bg-danger badge-notification rounded-pill text-dark");
    			add_location(span, file$6, 71, 16, 2066);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(71:14) {#if result.data.total}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { getTotalByStatus }
    function create_pending_block_2$1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_2$1.name,
    		type: "pending",
    		source: "(1:0) <script>   import { getTotalByStatus }",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { getTotalByStatus }
    function create_catch_block_1$1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_1$1.name,
    		type: "catch",
    		source: "(1:0) <script>   import { getTotalByStatus }",
    		ctx
    	});

    	return block;
    }

    // (88:48)                {#if result.data.total}
    function create_then_block_1$1(ctx) {
    	let if_block_anchor;
    	let if_block = /*result*/ ctx[9].data.total && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*result*/ ctx[9].data.total) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block_1$1.name,
    		type: "then",
    		source: "(88:48)                {#if result.data.total}",
    		ctx
    	});

    	return block;
    }

    // (89:14) {#if result.data.total}
    function create_if_block$2(ctx) {
    	let span;
    	let t_value = /*result*/ ctx[9].data.total + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "badge bg-danger badge-notification rounded-pill text-dark");
    			add_location(span, file$6, 89, 16, 2665);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(89:14) {#if result.data.total}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { getTotalByStatus }
    function create_pending_block_1$1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_1$1.name,
    		type: "pending",
    		source: "(1:0) <script>   import { getTotalByStatus }",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { getTotalByStatus }
    function create_catch_block$3(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$3.name,
    		type: "catch",
    		source: "(1:0) <script>   import { getTotalByStatus }",
    		ctx
    	});

    	return block;
    }

    // (106:48)                <span                 class="badge  bg-light badge-notification rounded-pill  text-dark"               >                 {result.data.total}
    function create_then_block$3(ctx) {
    	let span;
    	let t_value = /*result*/ ctx[9].data.total + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "badge  bg-light badge-notification rounded-pill  text-dark");
    			add_location(span, file$6, 106, 14, 3201);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$3.name,
    		type: "then",
    		source: "(106:48)                <span                 class=\\\"badge  bg-light badge-notification rounded-pill  text-dark\\\"               >                 {result.data.total}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { getTotalByStatus }
    function create_pending_block$3(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$3.name,
    		type: "pending",
    		source: "(1:0) <script>   import { getTotalByStatus }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let nav;
    	let div2;
    	let button0;
    	let i0;
    	let t0;
    	let div1;
    	let ul;
    	let li0;
    	let a0;
    	let t1;
    	let span0;
    	let t2;
    	let t3;
    	let li1;
    	let a1;
    	let t4;
    	let small0;
    	let span1;
    	let t6;
    	let t7;
    	let li2;
    	let a2;
    	let t8;
    	let small1;
    	let span2;
    	let t10;
    	let t11;
    	let li3;
    	let a3;
    	let t12;
    	let span3;
    	let t13;
    	let t14;
    	let div0;
    	let button1;
    	let i1;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block_3,
    		then: create_then_block_3,
    		catch: create_catch_block_3,
    		value: 9
    	};

    	handle_promise(/*totalNumbers*/ ctx[2][0], info);

    	let info_1 = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block_2$1,
    		then: create_then_block_2$1,
    		catch: create_catch_block_2$1,
    		value: 9
    	};

    	handle_promise(/*totalNumbers*/ ctx[2][1], info_1);

    	let info_2 = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block_1$1,
    		then: create_then_block_1$1,
    		catch: create_catch_block_1$1,
    		value: 9
    	};

    	handle_promise(/*totalNumbers*/ ctx[2][2], info_2);

    	let info_3 = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$3,
    		then: create_then_block$3,
    		catch: create_catch_block$3,
    		value: 9
    	};

    	handle_promise(/*totalNumbers*/ ctx[2][3], info_3);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div2 = element("div");
    			button0 = element("button");
    			i0 = element("i");
    			t0 = space();
    			div1 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			t1 = text("신규 접수\n            ");
    			span0 = element("span");
    			t2 = space();
    			info.block.c();
    			t3 = space();
    			li1 = element("li");
    			a1 = element("a");
    			t4 = text("1차 확인 ");
    			small0 = element("small");
    			small0.textContent = "(사장님)";
    			span1 = element("span");
    			t6 = space();
    			info_1.block.c();
    			t7 = space();
    			li2 = element("li");
    			a2 = element("a");
    			t8 = text("2차 확인 ");
    			small1 = element("small");
    			small1.textContent = "(p1331)";
    			span2 = element("span");
    			t10 = space();
    			info_2.block.c();
    			t11 = space();
    			li3 = element("li");
    			a3 = element("a");
    			t12 = text("답변 완료");
    			span3 = element("span");
    			t13 = space();
    			info_3.block.c();
    			t14 = space();
    			div0 = element("div");
    			button1 = element("button");
    			i1 = element("i");
    			attr_dev(i0, "class", "fas fa-bars");
    			add_location(i0, file$6, 35, 6, 902);
    			attr_dev(button0, "class", "navbar-toggler");
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "data-mdb-toggle", "collapse");
    			attr_dev(button0, "data-mdb-target", "#navbarButtonsExample");
    			attr_dev(button0, "aria-controls", "navbarButtonsExample");
    			attr_dev(button0, "aria-expanded", "false");
    			attr_dev(button0, "aria-label", "Toggle navigation");
    			add_location(button0, file$6, 26, 4, 646);
    			attr_dev(span0, "class", "m-1");
    			add_location(span0, file$6, 50, 12, 1345);
    			attr_dev(a0, "class", "nav-link");
    			attr_dev(a0, "href", "javascript:void(0)");
    			toggle_class(a0, "active", /*status*/ ctx[0] == 0);
    			add_location(a0, file$6, 43, 10, 1149);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file$6, 42, 8, 1117);
    			add_location(small0, file$6, 68, 19, 1922);
    			attr_dev(span1, "class", "m-1");
    			add_location(span1, file$6, 68, 39, 1942);
    			attr_dev(a1, "class", "nav-link");
    			attr_dev(a1, "href", "javascript:void(0)");
    			toggle_class(a1, "active", /*status*/ ctx[0] == 1);
    			add_location(a1, file$6, 63, 10, 1749);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$6, 62, 8, 1717);
    			add_location(small1, file$6, 86, 19, 2519);
    			attr_dev(span2, "class", "m-1");
    			add_location(span2, file$6, 86, 41, 2541);
    			attr_dev(a2, "class", "nav-link");
    			attr_dev(a2, "href", "javascript:void(0)");
    			toggle_class(a2, "active", /*status*/ ctx[0] == 2);
    			add_location(a2, file$6, 81, 10, 2346);
    			attr_dev(li2, "class", "nav-item");
    			add_location(li2, file$6, 80, 8, 2314);
    			attr_dev(span3, "class", "m-1");
    			add_location(span3, file$6, 104, 18, 3117);
    			attr_dev(a3, "class", "nav-link");
    			attr_dev(a3, "href", "javascript:void(0)");
    			toggle_class(a3, "active", /*status*/ ctx[0] == 3);
    			add_location(a3, file$6, 99, 10, 2945);
    			attr_dev(li3, "class", "nav-item");
    			add_location(li3, file$6, 98, 8, 2913);
    			attr_dev(ul, "class", "navbar-nav me-auto");
    			add_location(ul, file$6, 41, 6, 1077);
    			attr_dev(i1, "class", "fas fa-pencil-alt");
    			add_location(i1, file$6, 121, 11, 3619);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn-light btn-rounded btn-lg");
    			add_location(button1, file$6, 117, 8, 3481);
    			attr_dev(div0, "class", "d-flex align-items-center");
    			add_location(div0, file$6, 116, 6, 3433);
    			attr_dev(div1, "class", "collapse navbar-collapse");
    			attr_dev(div1, "id", "navbarButtonsExample");
    			add_location(div1, file$6, 39, 4, 980);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file$6, 24, 2, 591);
    			attr_dev(nav, "class", "navbar navbar-expand-lg navbar-dark bg-dark");
    			add_location(nav, file$6, 22, 0, 502);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div2);
    			append_dev(div2, button0);
    			append_dev(button0, i0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(a0, t1);
    			append_dev(a0, span0);
    			append_dev(a0, t2);
    			info.block.m(a0, info.anchor = null);
    			info.mount = () => a0;
    			info.anchor = null;
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(a1, t4);
    			append_dev(a1, small0);
    			append_dev(a1, span1);
    			append_dev(a1, t6);
    			info_1.block.m(a1, info_1.anchor = null);
    			info_1.mount = () => a1;
    			info_1.anchor = null;
    			append_dev(ul, t7);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(a2, t8);
    			append_dev(a2, small1);
    			append_dev(a2, span2);
    			append_dev(a2, t10);
    			info_2.block.m(a2, info_2.anchor = null);
    			info_2.mount = () => a2;
    			info_2.anchor = null;
    			append_dev(ul, t11);
    			append_dev(ul, li3);
    			append_dev(li3, a3);
    			append_dev(a3, t12);
    			append_dev(a3, span3);
    			append_dev(a3, t13);
    			info_3.block.m(a3, info_3.anchor = null);
    			info_3.mount = () => a3;
    			info_3.anchor = null;
    			append_dev(div1, t14);
    			append_dev(div1, div0);
    			append_dev(div0, button1);
    			append_dev(button1, i1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", /*click_handler*/ ctx[3], false, false, false),
    					listen_dev(a1, "click", /*click_handler_1*/ ctx[4], false, false, false),
    					listen_dev(a2, "click", /*click_handler_2*/ ctx[5], false, false, false),
    					listen_dev(a3, "click", /*click_handler_3*/ ctx[6], false, false, false),
    					listen_dev(button1, "click", /*click_handler_4*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);

    			if (dirty & /*status*/ 1) {
    				toggle_class(a0, "active", /*status*/ ctx[0] == 0);
    			}

    			update_await_block_branch(info_1, ctx, dirty);

    			if (dirty & /*status*/ 1) {
    				toggle_class(a1, "active", /*status*/ ctx[0] == 1);
    			}

    			update_await_block_branch(info_2, ctx, dirty);

    			if (dirty & /*status*/ 1) {
    				toggle_class(a2, "active", /*status*/ ctx[0] == 2);
    			}

    			update_await_block_branch(info_3, ctx, dirty);

    			if (dirty & /*status*/ 1) {
    				toggle_class(a3, "active", /*status*/ ctx[0] == 3);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			info.block.d();
    			info.token = null;
    			info = null;
    			info_1.block.d();
    			info_1.token = null;
    			info_1 = null;
    			info_2.block.d();
    			info_2.token = null;
    			info_2 = null;
    			info_3.block.d();
    			info_3.token = null;
    			info_3 = null;
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
    	validate_slots("ListHeader", slots, []);
    	const dispatch = createEventDispatcher();

    	function changeStatus(num) {
    		$$invalidate(0, status = num);
    		dispatch("change");
    	}

    	let { status } = $$props;

    	let totalNumbers = [
    		getTotalByStatus$1(0),
    		getTotalByStatus$1(1),
    		getTotalByStatus$1(2),
    		getTotalByStatus$1(3)
    	];

    	const writable_props = ["status"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ListHeader> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => changeStatus(0);
    	const click_handler_1 = () => changeStatus(1);
    	const click_handler_2 = () => changeStatus(2);
    	const click_handler_3 = () => changeStatus(3);
    	const click_handler_4 = () => push("/request");

    	$$self.$$set = $$props => {
    		if ("status" in $$props) $$invalidate(0, status = $$props.status);
    	};

    	$$self.$capture_state = () => ({
    		getTotalByStatus: getTotalByStatus$1,
    		createEventDispatcher,
    		push,
    		dataset_dev,
    		dispatch,
    		changeStatus,
    		status,
    		totalNumbers
    	});

    	$$self.$inject_state = $$props => {
    		if ("status" in $$props) $$invalidate(0, status = $$props.status);
    		if ("totalNumbers" in $$props) $$invalidate(2, totalNumbers = $$props.totalNumbers);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		status,
    		changeStatus,
    		totalNumbers,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class ListHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { status: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ListHeader",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*status*/ ctx[0] === undefined && !("status" in props)) {
    			console.warn("<ListHeader> was created without expected prop 'status'");
    		}
    	}

    	get status() {
    		throw new Error("<ListHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set status(value) {
    		throw new Error("<ListHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/RequestForm.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;
    const file$5 = "src/routes/RequestForm.svelte";

    function get_each_context$2(ctx, list, i) {
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

    // (294:10) {:else}
    function create_else_block$1(ctx) {
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
    			add_location(div, file$5, 294, 12, 9904);
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(294:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (90:10) {#if !submitted}
    function create_if_block$1(ctx) {
    	let div22;
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
    	let div21;
    	let div18;
    	let alert;
    	let updating_showAlert;
    	let updating_message;
    	let t54;
    	let div19;
    	let button0;
    	let t56;
    	let div20;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;

    	function imagepicker0_value_binding(value) {
    		/*imagepicker0_value_binding*/ ctx[16](value);
    	}

    	let imagepicker0_props = { active: true };

    	if (/*images*/ ctx[5][0] !== void 0) {
    		imagepicker0_props.value = /*images*/ ctx[5][0];
    	}

    	imagepicker0 = new ImagePicker({
    			props: imagepicker0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(imagepicker0, "value", imagepicker0_value_binding));

    	function imagepicker1_value_binding(value) {
    		/*imagepicker1_value_binding*/ ctx[17](value);
    	}

    	let imagepicker1_props = { active: true };

    	if (/*images*/ ctx[5][1] !== void 0) {
    		imagepicker1_props.value = /*images*/ ctx[5][1];
    	}

    	imagepicker1 = new ImagePicker({
    			props: imagepicker1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(imagepicker1, "value", imagepicker1_value_binding));

    	function imagepicker2_value_binding(value) {
    		/*imagepicker2_value_binding*/ ctx[18](value);
    	}

    	let imagepicker2_props = { active: true };

    	if (/*images*/ ctx[5][2] !== void 0) {
    		imagepicker2_props.value = /*images*/ ctx[5][2];
    	}

    	imagepicker2 = new ImagePicker({
    			props: imagepicker2_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(imagepicker2, "value", imagepicker2_value_binding));

    	function imagepicker3_value_binding(value) {
    		/*imagepicker3_value_binding*/ ctx[19](value);
    	}

    	let imagepicker3_props = { active: true };

    	if (/*images*/ ctx[5][3] !== void 0) {
    		imagepicker3_props.value = /*images*/ ctx[5][3];
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

    	handle_promise(/*productTypes*/ ctx[9], info);

    	let info_1 = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$2,
    		then: create_then_block$2,
    		catch: create_catch_block$2,
    		value: 32
    	};

    	handle_promise(/*livingTypes*/ ctx[8], info_1);

    	function alert_showAlert_binding(value) {
    		/*alert_showAlert_binding*/ ctx[22](value);
    	}

    	function alert_message_binding(value) {
    		/*alert_message_binding*/ ctx[23](value);
    	}

    	let alert_props = {};

    	if (/*showAlert*/ ctx[1] !== void 0) {
    		alert_props.showAlert = /*showAlert*/ ctx[1];
    	}

    	if (/*message*/ ctx[2] !== void 0) {
    		alert_props.message = /*message*/ ctx[2];
    	}

    	alert = new Alert({ props: alert_props, $$inline: true });
    	binding_callbacks.push(() => bind(alert, "showAlert", alert_showAlert_binding));
    	binding_callbacks.push(() => bind(alert, "message", alert_message_binding));

    	const block = {
    		c: function create() {
    			div22 = element("div");
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
    			div21 = element("div");
    			div18 = element("div");
    			create_component(alert.$$.fragment);
    			t54 = space();
    			div19 = element("div");
    			button0 = element("button");
    			button0.textContent = "이전";
    			t56 = space();
    			div20 = element("div");
    			button1 = element("button");
    			button1.textContent = "접수";
    			attr_dev(h2, "class", "card-title");
    			add_location(h2, file$5, 91, 14, 2689);
    			attr_dev(p, "class", "card-text");
    			add_location(p, file$5, 92, 14, 2740);
    			add_location(hr0, file$5, 93, 14, 2796);
    			attr_dev(h50, "class", "card-title");
    			add_location(h50, file$5, 96, 16, 2887);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control form-control-lg border");
    			input0.required = true;
    			add_location(input0, file$5, 97, 16, 2942);
    			attr_dev(div0, "class", "form-outline");
    			add_location(div0, file$5, 95, 14, 2844);
    			add_location(hr1, file$5, 104, 14, 3158);
    			attr_dev(h51, "class", "card-title");
    			add_location(h51, file$5, 107, 16, 3248);
    			attr_dev(div1, "class", "col-lg-3 col-6 p-1");
    			add_location(div1, file$5, 109, 18, 3335);
    			attr_dev(div2, "class", "col-lg-3 col-6 p-1");
    			add_location(div2, file$5, 112, 18, 3477);
    			attr_dev(div3, "class", "col-lg-3 col-6 p-1");
    			add_location(div3, file$5, 116, 18, 3620);
    			attr_dev(div4, "class", "col-lg-3 col-6 p-1");
    			add_location(div4, file$5, 120, 18, 3763);
    			attr_dev(div5, "class", "row p-2");
    			add_location(div5, file$5, 108, 16, 3295);
    			attr_dev(div6, "class", "form-outline");
    			add_location(div6, file$5, 106, 14, 3205);
    			add_location(hr2, file$5, 125, 14, 3945);
    			attr_dev(h52, "class", "card-title");
    			add_location(h52, file$5, 128, 16, 4038);
    			attr_dev(div7, "class", "btn-group m-1");
    			add_location(div7, file$5, 129, 16, 4089);
    			attr_dev(div8, "class", "form-outline");
    			add_location(div8, file$5, 127, 14, 3995);
    			add_location(hr3, file$5, 148, 14, 4827);
    			attr_dev(h53, "class", "card-title");
    			add_location(h53, file$5, 151, 16, 4920);
    			attr_dev(div9, "class", "btn-group m-1");
    			add_location(div9, file$5, 152, 16, 4970);
    			attr_dev(div10, "class", "form-outline");
    			add_location(div10, file$5, 150, 14, 4877);
    			add_location(hr4, file$5, 171, 14, 5703);
    			attr_dev(h54, "class", "card-title");
    			add_location(h54, file$5, 175, 16, 5794);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "class", "form-control form-control-lg border w-25");
    			add_location(input1, file$5, 177, 18, 5899);
    			attr_dev(span, "class", "p-1");
    			add_location(span, file$5, 182, 18, 6094);
    			attr_dev(div11, "class", "d-flex align-items-center");
    			add_location(div11, file$5, 176, 16, 5841);
    			attr_dev(div12, "class", "form-outline");
    			add_location(div12, file$5, 174, 14, 5751);
    			add_location(hr5, file$5, 185, 14, 6179);
    			attr_dev(h55, "class", "card-title");
    			add_location(h55, file$5, 189, 16, 6275);
    			attr_dev(input2, "type", "radio");
    			attr_dev(input2, "class", "btn-check");
    			attr_dev(input2, "name", "isburiedpipe");
    			attr_dev(input2, "id", "isburiedpipe1");
    			input2.value = "true";
    			input2.required = true;
    			add_location(input2, file$5, 191, 18, 6373);
    			attr_dev(label0, "class", "btn btn-light btn-lg");
    			attr_dev(label0, "for", "isburiedpipe1");
    			add_location(label0, file$5, 200, 18, 6682);
    			attr_dev(input3, "type", "radio");
    			attr_dev(input3, "class", "btn-check");
    			attr_dev(input3, "name", "isburiedpipe");
    			attr_dev(input3, "id", "isburiedpipe2");
    			input3.value = "false";
    			input3.required = true;
    			add_location(input3, file$5, 203, 18, 6806);
    			attr_dev(label1, "class", "btn btn-light btn-lg");
    			attr_dev(label1, "for", "isburiedpipe2");
    			add_location(label1, file$5, 212, 18, 7116);
    			attr_dev(div13, "class", "btn-group m-1");
    			add_location(div13, file$5, 190, 16, 6327);
    			attr_dev(div14, "class", "form-outline");
    			add_location(div14, file$5, 188, 14, 6232);
    			add_location(hr6, file$5, 217, 14, 7280);
    			attr_dev(h56, "class", "card-title");
    			add_location(h56, file$5, 220, 16, 7373);
    			attr_dev(input4, "type", "radio");
    			attr_dev(input4, "class", "btn-check");
    			attr_dev(input4, "name", "uninstalloption");
    			attr_dev(input4, "id", "uninstalloption1");
    			input4.value = "보관";
    			add_location(input4, file$5, 222, 18, 7469);
    			attr_dev(label2, "class", "btn btn-light btn-lg");
    			attr_dev(label2, "for", "uninstalloption1");
    			add_location(label2, file$5, 230, 18, 7756);
    			attr_dev(input5, "type", "radio");
    			attr_dev(input5, "class", "btn-check");
    			attr_dev(input5, "name", "uninstalloption");
    			attr_dev(input5, "id", "uninstalloption2");
    			input5.value = "폐기";
    			add_location(input5, file$5, 233, 18, 7889);
    			attr_dev(label3, "class", "btn btn-light btn-lg");
    			attr_dev(label3, "for", "uninstalloption2");
    			add_location(label3, file$5, 241, 18, 8176);
    			attr_dev(input6, "type", "radio");
    			attr_dev(input6, "class", "btn-check");
    			attr_dev(input6, "name", "uninstalloption");
    			attr_dev(input6, "id", "uninstalloption3");
    			input6.value = "없음";
    			add_location(input6, file$5, 244, 18, 8309);
    			attr_dev(label4, "class", "btn btn-light btn-lg");
    			attr_dev(label4, "for", "uninstalloption3");
    			add_location(label4, file$5, 252, 18, 8596);
    			attr_dev(div15, "class", "btn-group m-1");
    			add_location(div15, file$5, 221, 16, 7423);
    			attr_dev(div16, "class", "form-outline");
    			add_location(div16, file$5, 219, 14, 7330);
    			add_location(hr7, file$5, 257, 14, 8769);
    			attr_dev(h57, "class", "card-title");
    			add_location(h57, file$5, 260, 16, 8861);
    			attr_dev(textarea, "class", "form-control border");
    			attr_dev(textarea, "rows", "4");
    			add_location(textarea, file$5, 261, 16, 8913);
    			attr_dev(div17, "class", "form-outline");
    			add_location(div17, file$5, 259, 14, 8818);
    			attr_dev(div18, "class", "col-12");
    			add_location(div18, file$5, 270, 16, 9155);
    			attr_dev(button0, "class", "btn btn-lg btn-light w-100");
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$5, 274, 18, 9309);
    			attr_dev(div19, "class", "col-3");
    			add_location(div19, file$5, 273, 16, 9271);
    			attr_dev(button1, "class", "btn btn-lg btn-success w-100");
    			attr_dev(button1, "type", "button");
    			add_location(button1, file$5, 283, 18, 9597);
    			attr_dev(div20, "class", "col-9");
    			add_location(div20, file$5, 282, 16, 9559);
    			attr_dev(div21, "class", "row mt-5");
    			add_location(div21, file$5, 269, 14, 9116);
    			attr_dev(div22, "class", "card-body");
    			add_location(div22, file$5, 90, 12, 2651);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div22, anchor);
    			append_dev(div22, h2);
    			append_dev(div22, t1);
    			append_dev(div22, p);
    			append_dev(div22, t3);
    			append_dev(div22, hr0);
    			append_dev(div22, t4);
    			append_dev(div22, div0);
    			append_dev(div0, h50);
    			append_dev(div0, t6);
    			append_dev(div0, input0);
    			set_input_value(input0, /*user*/ ctx[4]);
    			append_dev(div22, t7);
    			append_dev(div22, hr1);
    			append_dev(div22, t8);
    			append_dev(div22, div6);
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
    			append_dev(div22, t14);
    			append_dev(div22, hr2);
    			append_dev(div22, t15);
    			append_dev(div22, div8);
    			append_dev(div8, h52);
    			append_dev(div8, t17);
    			append_dev(div8, div7);
    			info.block.m(div7, info.anchor = null);
    			info.mount = () => div7;
    			info.anchor = null;
    			append_dev(div22, t18);
    			append_dev(div22, hr3);
    			append_dev(div22, t19);
    			append_dev(div22, div10);
    			append_dev(div10, h53);
    			append_dev(div10, t21);
    			append_dev(div10, div9);
    			info_1.block.m(div9, info_1.anchor = null);
    			info_1.mount = () => div9;
    			info_1.anchor = null;
    			append_dev(div22, t22);
    			append_dev(div22, hr4);
    			append_dev(div22, t23);
    			append_dev(div22, div12);
    			append_dev(div12, h54);
    			append_dev(div12, t25);
    			append_dev(div12, div11);
    			append_dev(div11, input1);
    			set_input_value(input1, /*floor_height*/ ctx[6]);
    			append_dev(div11, t26);
    			append_dev(div11, span);
    			append_dev(div22, t28);
    			append_dev(div22, hr5);
    			append_dev(div22, t29);
    			append_dev(div22, div14);
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
    			append_dev(div22, t37);
    			append_dev(div22, hr6);
    			append_dev(div22, t38);
    			append_dev(div22, div16);
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
    			append_dev(div22, t49);
    			append_dev(div22, hr7);
    			append_dev(div22, t50);
    			append_dev(div22, div17);
    			append_dev(div17, h57);
    			append_dev(div17, t52);
    			append_dev(div17, textarea);
    			set_input_value(textarea, /*comment*/ ctx[7]);
    			append_dev(div22, t53);
    			append_dev(div22, div21);
    			append_dev(div21, div18);
    			mount_component(alert, div18, null);
    			append_dev(div21, t54);
    			append_dev(div21, div19);
    			append_dev(div19, button0);
    			append_dev(div21, t56);
    			append_dev(div21, div20);
    			append_dev(div20, button1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[15]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[20]),
    					listen_dev(input2, "change", /*changeIsBuriedPipe*/ ctx[13], false, false, false),
    					listen_dev(input3, "change", /*changeIsBuriedPipe*/ ctx[13], false, false, false),
    					listen_dev(input4, "change", /*changeUninstallOption*/ ctx[14], false, false, false),
    					listen_dev(input5, "change", /*changeUninstallOption*/ ctx[14], false, false, false),
    					listen_dev(input6, "change", /*changeUninstallOption*/ ctx[14], false, false, false),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[21]),
    					listen_dev(button0, "click", /*click_handler*/ ctx[24], false, false, false),
    					listen_dev(button1, "click", /*handleSubmit*/ ctx[10], false, false, false)
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

    			if (!updating_value && dirty[0] & /*images*/ 32) {
    				updating_value = true;
    				imagepicker0_changes.value = /*images*/ ctx[5][0];
    				add_flush_callback(() => updating_value = false);
    			}

    			imagepicker0.$set(imagepicker0_changes);
    			const imagepicker1_changes = {};

    			if (!updating_value_1 && dirty[0] & /*images*/ 32) {
    				updating_value_1 = true;
    				imagepicker1_changes.value = /*images*/ ctx[5][1];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			imagepicker1.$set(imagepicker1_changes);
    			const imagepicker2_changes = {};

    			if (!updating_value_2 && dirty[0] & /*images*/ 32) {
    				updating_value_2 = true;
    				imagepicker2_changes.value = /*images*/ ctx[5][2];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			imagepicker2.$set(imagepicker2_changes);
    			const imagepicker3_changes = {};

    			if (!updating_value_3 && dirty[0] & /*images*/ 32) {
    				updating_value_3 = true;
    				imagepicker3_changes.value = /*images*/ ctx[5][3];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			imagepicker3.$set(imagepicker3_changes);
    			update_await_block_branch(info, ctx, dirty);
    			update_await_block_branch(info_1, ctx, dirty);

    			if (dirty[0] & /*floor_height*/ 64 && to_number(input1.value) !== /*floor_height*/ ctx[6]) {
    				set_input_value(input1, /*floor_height*/ ctx[6]);
    			}

    			if (dirty[0] & /*comment*/ 128) {
    				set_input_value(textarea, /*comment*/ ctx[7]);
    			}

    			const alert_changes = {};

    			if (!updating_showAlert && dirty[0] & /*showAlert*/ 2) {
    				updating_showAlert = true;
    				alert_changes.showAlert = /*showAlert*/ ctx[1];
    				add_flush_callback(() => updating_showAlert = false);
    			}

    			if (!updating_message && dirty[0] & /*message*/ 4) {
    				updating_message = true;
    				alert_changes.message = /*message*/ ctx[2];
    				add_flush_callback(() => updating_message = false);
    			}

    			alert.$set(alert_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imagepicker0.$$.fragment, local);
    			transition_in(imagepicker1.$$.fragment, local);
    			transition_in(imagepicker2.$$.fragment, local);
    			transition_in(imagepicker3.$$.fragment, local);
    			transition_in(alert.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imagepicker0.$$.fragment, local);
    			transition_out(imagepicker1.$$.fragment, local);
    			transition_out(imagepicker2.$$.fragment, local);
    			transition_out(imagepicker3.$$.fragment, local);
    			transition_out(alert.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div22);
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
    			destroy_component(alert);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(90:10) {#if !submitted}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { pop, push }
    function create_catch_block_2(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_2.name,
    		type: "catch",
    		source: "(1:0) <script>   import { pop, push }",
    		ctx
    	});

    	return block;
    }

    // (298:14) {:then result}
    function create_then_block_2(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*result*/ ctx[39].success) return create_if_block_1$1;
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
    		source: "(298:14) {:then result}",
    		ctx
    	});

    	return block;
    }

    // (305:16) {:else}
    function create_else_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "오류가 발생했습니다.";
    			add_location(p, file$5, 305, 18, 10271);
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
    		source: "(305:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (299:16) {#if result.success}
    function create_if_block_1$1(ctx) {
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
    			add_location(small, file$5, 300, 32, 10114);
    			add_location(h1, file$5, 299, 18, 10077);
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(299:16) {#if result.success}",
    		ctx
    	});

    	return block;
    }

    // (296:33)                  <p>waiting</p>               {:then result}
    function create_pending_block_2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "waiting";
    			add_location(p, file$5, 296, 16, 9978);
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
    		source: "(296:33)                  <p>waiting</p>               {:then result}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { pop, push }
    function create_catch_block_1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_1.name,
    		type: "catch",
    		source: "(1:0) <script>   import { pop, push }",
    		ctx
    	});

    	return block;
    }

    // (131:50)                      {#each types as { type_no, type }}
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
    			if (dirty[0] & /*productTypes, changeProductType*/ 2560) {
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
    		source: "(131:50)                      {#each types as { type_no, type }}",
    		ctx
    	});

    	return block;
    }

    // (132:20) {#each types as { type_no, type }}
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
    			add_location(input, file$5, 132, 22, 4245);
    			attr_dev(label, "class", "btn btn-light btn-lg");
    			attr_dev(label, "for", "producttype" + /*type_no*/ ctx[33]);
    			add_location(label, file$5, 140, 22, 4565);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, label, anchor);
    			append_dev(label, t1);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*changeProductType*/ ctx[11], false, false, false);
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
    		source: "(132:20) {#each types as { type_no, type }}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { pop, push }
    function create_pending_block_1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_1.name,
    		type: "pending",
    		source: "(1:0) <script>   import { pop, push }",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { pop, push }
    function create_catch_block$2(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$2.name,
    		type: "catch",
    		source: "(1:0) <script>   import { pop, push }",
    		ctx
    	});

    	return block;
    }

    // (154:49)                      {#each types as { type_no, type }}
    function create_then_block$2(ctx) {
    	let each_1_anchor;
    	let each_value = /*types*/ ctx[32];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
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
    			if (dirty[0] & /*livingTypes, changeLivingType*/ 4352) {
    				each_value = /*types*/ ctx[32];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
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
    		id: create_then_block$2.name,
    		type: "then",
    		source: "(154:49)                      {#each types as { type_no, type }}",
    		ctx
    	});

    	return block;
    }

    // (155:20) {#each types as { type_no, type }}
    function create_each_block$2(ctx) {
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
    			add_location(input, file$5, 155, 22, 5125);
    			attr_dev(label, "class", "btn btn-light btn-lg");
    			attr_dev(label, "for", "livingtype" + /*type_no*/ ctx[33]);
    			add_location(label, file$5, 163, 22, 5442);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, label, anchor);
    			append_dev(label, t1);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*changeLivingType*/ ctx[12], false, false, false);
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
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(155:20) {#each types as { type_no, type }}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { pop, push }
    function create_pending_block$2(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$2.name,
    		type: "pending",
    		source: "(1:0) <script>   import { pop, push }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let main;
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block$1];
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
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			if_block.c();
    			attr_dev(div0, "class", "card rounded-0 p-2");
    			add_location(div0, file$5, 88, 8, 2579);
    			attr_dev(div1, "class", "col-12");
    			add_location(div1, file$5, 87, 6, 2550);
    			attr_dev(div2, "class", "row d-flex justify-content-center");
    			add_location(div2, file$5, 86, 4, 2496);
    			attr_dev(div3, "class", "container p-3");
    			add_location(div3, file$5, 85, 2, 2464);
    			add_location(main, file$5, 84, 0, 2455);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			if_blocks[current_block_type_index].m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
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
    				if_block.m(div0, null);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
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
    		image_url = makeImageUrl();
    		if (user == "" || user == undefined) return false; else if (image_url == "" || image_url == undefined) return false; else if (product_type == undefined) return false; else if (living_type == undefined) return false; else if (floor_height == undefined) return false; else if (is_buried_pipe == undefined) return false; else if (uninstall_option == undefined) return false; else return true;
    	};

    	let showAlert = false;
    	let message = "";
    	let postResult;

    	const handleSubmit = () => {
    		if (validateValues()) {
    			$$invalidate(0, submitted = true);
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

    		$$invalidate(3, postResult = postForm(JSON.stringify(payload)));
    		console.log(postResult);
    	};

    	// input variables
    	let user;

    	let image_url;
    	let images = [];
    	let product_type;

    	let changeProductType = event => {
    		product_type = event.currentTarget.value;
    	};

    	let living_type;

    	let changeLivingType = event => {
    		living_type = event.currentTarget.value;
    	};

    	let floor_height;
    	let is_buried_pipe;

    	let changeIsBuriedPipe = event => {
    		if (event.currentTarget.value == "true") is_buried_pipe = true; else is_buried_pipe = false;
    	};

    	let uninstall_option;

    	let changeUninstallOption = event => {
    		uninstall_option = event.currentTarget.value;
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
    			$$invalidate(5, images);
    		}
    	}

    	function imagepicker1_value_binding(value) {
    		if ($$self.$$.not_equal(images[1], value)) {
    			images[1] = value;
    			$$invalidate(5, images);
    		}
    	}

    	function imagepicker2_value_binding(value) {
    		if ($$self.$$.not_equal(images[2], value)) {
    			images[2] = value;
    			$$invalidate(5, images);
    		}
    	}

    	function imagepicker3_value_binding(value) {
    		if ($$self.$$.not_equal(images[3], value)) {
    			images[3] = value;
    			$$invalidate(5, images);
    		}
    	}

    	function input1_input_handler() {
    		floor_height = to_number(this.value);
    		$$invalidate(6, floor_height);
    	}

    	function textarea_input_handler() {
    		comment = this.value;
    		$$invalidate(7, comment);
    	}

    	function alert_showAlert_binding(value) {
    		showAlert = value;
    		$$invalidate(1, showAlert);
    	}

    	function alert_message_binding(value) {
    		message = value;
    		$$invalidate(2, message);
    	}

    	const click_handler = () => pop();

    	$$self.$capture_state = () => ({
    		pop,
    		push,
    		each,
    		ImagePicker,
    		getLivingTypes,
    		getProductTypes,
    		postForm,
    		Alert,
    		ListHeader,
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
    		if ("image_url" in $$props) image_url = $$props.image_url;
    		if ("images" in $$props) $$invalidate(5, images = $$props.images);
    		if ("product_type" in $$props) product_type = $$props.product_type;
    		if ("changeProductType" in $$props) $$invalidate(11, changeProductType = $$props.changeProductType);
    		if ("living_type" in $$props) living_type = $$props.living_type;
    		if ("changeLivingType" in $$props) $$invalidate(12, changeLivingType = $$props.changeLivingType);
    		if ("floor_height" in $$props) $$invalidate(6, floor_height = $$props.floor_height);
    		if ("is_buried_pipe" in $$props) is_buried_pipe = $$props.is_buried_pipe;
    		if ("changeIsBuriedPipe" in $$props) $$invalidate(13, changeIsBuriedPipe = $$props.changeIsBuriedPipe);
    		if ("uninstall_option" in $$props) uninstall_option = $$props.uninstall_option;
    		if ("changeUninstallOption" in $$props) $$invalidate(14, changeUninstallOption = $$props.changeUninstallOption);
    		if ("comment" in $$props) $$invalidate(7, comment = $$props.comment);
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
    		images,
    		floor_height,
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
    		alert_showAlert_binding,
    		alert_message_binding,
    		click_handler
    	];
    }

    class RequestForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RequestForm",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    const getRequest = async (requestNo) => {
        const host = `${apiHost}/get_request?request_no=${requestNo}`;
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

    /* src/components/ImageHeader/ImageHeader.svelte generated by Svelte v3.38.2 */

    const file$4 = "src/components/ImageHeader/ImageHeader.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (6:2) {#each images as image, i}
    function create_each_block$1(ctx) {
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
    			add_location(img0, file$4, 13, 12, 328);
    			attr_dev(a, "class", "h-100 w-100 d-flex justify-content-center align-items-center");
    			add_location(a, file$4, 10, 10, 220);
    			attr_dev(div0, "class", "content svelte-8pu3ms");
    			add_location(div0, file$4, 9, 8, 188);
    			attr_dev(div1, "class", "square border svelte-8pu3ms");
    			add_location(div1, file$4, 8, 6, 152);
    			attr_dev(div2, "class", "col-3 p-1");
    			add_location(div2, file$4, 7, 4, 122);
    			if (img1.src !== (img1_src_value = /*image*/ ctx[1])) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "이미지" + /*i*/ ctx[3]);
    			attr_dev(img1, "class", "img-fluid p-3");
    			attr_dev(img1, "tabindex", "1");
    			add_location(img1, file$4, 34, 8, 822);
    			attr_dev(div3, "class", "modal-dialog modal-dialog-centered");
    			add_location(div3, file$4, 33, 6, 765);
    			attr_dev(div4, "class", "modal fade");
    			attr_dev(div4, "id", "modal" + /*i*/ ctx[3]);
    			attr_dev(div4, "tabindex", "-1");
    			attr_dev(div4, "role", "dialog");
    			attr_dev(div4, "aria-labelledby", /*i*/ ctx[3]);
    			attr_dev(div4, "aria-hidden", "true");
    			add_location(div4, file$4, 25, 4, 612);
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
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(6:2) {#each images as image, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let each_value = /*images*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "row");
    			add_location(div, file$4, 4, 0, 46);
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
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { images: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageHeader",
    			options,
    			id: create_fragment$6.name
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
    const file$3 = "src/routes/Viewer.svelte";

    // (1:0) <script>   import { pop }
    function create_catch_block$1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(1:0) <script>   import { pop }",
    		ctx
    	});

    	return block;
    }

    // (35:32)        <div class="row">         <div class="col mt-2">           <div class="d-flex align-items-end justify-content-between">             <div class="p-1">               <h3 class="mb-0">                 <i class="fas fa-user-circle m-1" />{result.data.user}
    function create_then_block$1(ctx) {
    	let div4;
    	let div3;
    	let div2;
    	let div0;
    	let h3;
    	let i;
    	let t0_value = /*result*/ ctx[26].data.user + "";
    	let t0;
    	let t1;
    	let div1;
    	let h50;
    	let span1;
    	let span0;
    	let t3_value = /*result*/ ctx[26].data.request_no + "";
    	let t3;
    	let t4;
    	let div6;
    	let div5;
    	let imageheader;
    	let t5;
    	let div8;
    	let div7;
    	let h51;
    	let span2;
    	let t6_value = /*result*/ ctx[26].data.product_type + "";
    	let t6;
    	let t7;
    	let h52;
    	let span3;
    	let t8_value = /*result*/ ctx[26].data.living_type + "";
    	let t8;
    	let t9;
    	let h53;
    	let span4;
    	let t10_value = /*result*/ ctx[26].data.floor_height + "";
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let h54;
    	let span5;
    	let t14;
    	let t15_value = /*result*/ ctx[26].data.uninstall_option + "";
    	let t15;
    	let current;

    	imageheader = new ImageHeader({
    			props: {
    				images: /*result*/ ctx[26].data.image_url.split()
    			},
    			$$inline: true
    		});

    	let if_block0 = /*result*/ ctx[26].data.is_buried_pipe && create_if_block_1(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*result*/ ctx[26].data.unsinstall_option == "없음") return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			i = element("i");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			h50 = element("h5");
    			span1 = element("span");
    			span0 = element("span");
    			span0.textContent = "Request No.\n                  ";
    			t3 = text(t3_value);
    			t4 = space();
    			div6 = element("div");
    			div5 = element("div");
    			create_component(imageheader.$$.fragment);
    			t5 = space();
    			div8 = element("div");
    			div7 = element("div");
    			h51 = element("h5");
    			span2 = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			h52 = element("h5");
    			span3 = element("span");
    			t8 = text(t8_value);
    			t9 = space();
    			h53 = element("h5");
    			span4 = element("span");
    			t10 = text(t10_value);
    			t11 = text("층");
    			t12 = space();
    			if (if_block0) if_block0.c();
    			t13 = space();
    			h54 = element("h5");
    			span5 = element("span");
    			if_block1.c();
    			t14 = space();
    			t15 = text(t15_value);
    			attr_dev(i, "class", "fas fa-user-circle m-1");
    			add_location(i, file$3, 40, 16, 1073);
    			attr_dev(h3, "class", "mb-0");
    			add_location(h3, file$3, 39, 14, 1039);
    			attr_dev(div0, "class", "p-1");
    			add_location(div0, file$3, 38, 12, 1007);
    			attr_dev(span0, "class", "d-none d-md-inline-block");
    			add_location(span0, file$3, 46, 19, 1302);
    			attr_dev(span1, "class", "badge bg-light text-dark");
    			add_location(span1, file$3, 45, 16, 1244);
    			attr_dev(h50, "class", "mb-0");
    			add_location(h50, file$3, 44, 14, 1210);
    			attr_dev(div1, "class", "-1");
    			add_location(div1, file$3, 43, 12, 1179);
    			attr_dev(div2, "class", "d-flex align-items-end justify-content-between");
    			add_location(div2, file$3, 37, 10, 934);
    			attr_dev(div3, "class", "col mt-2");
    			add_location(div3, file$3, 36, 8, 901);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$3, 35, 6, 875);
    			attr_dev(div5, "class", "col px-4 py-2");
    			add_location(div5, file$3, 56, 8, 1564);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file$3, 55, 6, 1538);
    			attr_dev(span2, "class", "badge bg-dark rounded-pill");
    			add_location(span2, file$3, 63, 12, 1782);
    			attr_dev(h51, "class", "mx-1");
    			add_location(h51, file$3, 62, 10, 1752);
    			attr_dev(span3, "class", "badge bg-dark rounded-pill");
    			add_location(span3, file$3, 68, 12, 1941);
    			attr_dev(h52, "class", "mx-1");
    			add_location(h52, file$3, 67, 10, 1911);
    			attr_dev(span4, "class", "badge bg-dark rounded-pill");
    			add_location(span4, file$3, 73, 12, 2099);
    			attr_dev(h53, "class", "mx-1");
    			add_location(h53, file$3, 72, 10, 2069);
    			attr_dev(span5, "class", "badge bg-dark rounded-pill");
    			add_location(span5, file$3, 83, 12, 2433);
    			attr_dev(h54, "class", "mx-1");
    			add_location(h54, file$3, 82, 10, 2403);
    			attr_dev(div7, "class", "col d-flex");
    			add_location(div7, file$3, 61, 8, 1717);
    			attr_dev(div8, "class", "row");
    			add_location(div8, file$3, 60, 6, 1691);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h3);
    			append_dev(h3, i);
    			append_dev(h3, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, h50);
    			append_dev(h50, span1);
    			append_dev(span1, span0);
    			append_dev(span1, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			mount_component(imageheader, div5, null);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div7);
    			append_dev(div7, h51);
    			append_dev(h51, span2);
    			append_dev(span2, t6);
    			append_dev(div7, t7);
    			append_dev(div7, h52);
    			append_dev(h52, span3);
    			append_dev(span3, t8);
    			append_dev(div7, t9);
    			append_dev(div7, h53);
    			append_dev(h53, span4);
    			append_dev(span4, t10);
    			append_dev(span4, t11);
    			append_dev(div7, t12);
    			if (if_block0) if_block0.m(div7, null);
    			append_dev(div7, t13);
    			append_dev(div7, h54);
    			append_dev(h54, span5);
    			if_block1.m(span5, null);
    			append_dev(span5, t14);
    			append_dev(span5, t15);
    			current = true;
    		},
    		p: noop,
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
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div6);
    			destroy_component(imageheader);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div8);
    			if (if_block0) if_block0.d();
    			if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(35:32)        <div class=\\\"row\\\">         <div class=\\\"col mt-2\\\">           <div class=\\\"d-flex align-items-end justify-content-between\\\">             <div class=\\\"p-1\\\">               <h3 class=\\\"mb-0\\\">                 <i class=\\\"fas fa-user-circle m-1\\\" />{result.data.user}",
    		ctx
    	});

    	return block;
    }

    // (78:10) {#if result.data.is_buried_pipe}
    function create_if_block_1(ctx) {
    	let h5;
    	let span;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			span = element("span");
    			span.textContent = "매립배관";
    			attr_dev(span, "class", "badge bg-dark rounded-pill");
    			add_location(span, file$3, 79, 14, 2306);
    			attr_dev(h5, "class", "mx-1");
    			add_location(h5, file$3, 78, 12, 2274);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, span);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(78:10) {#if result.data.is_buried_pipe}",
    		ctx
    	});

    	return block;
    }

    // (87:14) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("철거 후");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(87:14) {:else}",
    		ctx
    	});

    	return block;
    }

    // (85:14) {#if result.data.unsinstall_option == "없음"}
    function create_if_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("기존 제품");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(85:14) {#if result.data.unsinstall_option == \\\"없음\\\"}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { pop }
    function create_pending_block$1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(1:0) <script>   import { pop }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let div29;
    	let div2;
    	let button0;
    	let i;
    	let t1;
    	let t2;
    	let div28;
    	let div27;
    	let table;
    	let thead;
    	let tr0;
    	let th;
    	let h1;
    	let u;
    	let t4;
    	let tbody;
    	let tr1;
    	let td0;
    	let t6;
    	let td1;
    	let div3;
    	let input0;
    	let t7;
    	let tr2;
    	let td2;
    	let hr0;
    	let t8;
    	let tr3;
    	let td3;
    	let t10;
    	let td4;
    	let div4;
    	let input1;
    	let t11;
    	let tr4;
    	let td5;
    	let hr1;
    	let t12;
    	let tr5;
    	let td6;
    	let t13;
    	let small;
    	let t15;
    	let td7;
    	let div5;
    	let input2;
    	let t16;
    	let tr6;
    	let td8;
    	let hr2;
    	let t17;
    	let tr7;
    	let td9;
    	let t19;
    	let td10;
    	let t20;
    	let tr8;
    	let td11;
    	let div7;
    	let div6;
    	let input3;
    	let t21;
    	let label0;
    	let t23;
    	let input4;
    	let t24;
    	let label1;
    	let t26;
    	let tr9;
    	let td12;
    	let hr3;
    	let t27;
    	let tr10;
    	let td13;
    	let t29;
    	let td14;
    	let div8;
    	let input5;
    	let t30;
    	let tr11;
    	let td15;
    	let t31;
    	let td16;
    	let div10;
    	let div9;
    	let input6;
    	let input6_disabled_value;
    	let t32;
    	let span0;
    	let t34;
    	let tr12;
    	let td17;
    	let hr4;
    	let t35;
    	let tr13;
    	let td18;
    	let t37;
    	let td19;
    	let div11;
    	let input7;
    	let t38;
    	let tr14;
    	let td20;
    	let t39;
    	let td21;
    	let div13;
    	let div12;
    	let input8;
    	let input8_disabled_value;
    	let t40;
    	let span1;
    	let t42;
    	let tr15;
    	let td22;
    	let hr5;
    	let t43;
    	let tr16;
    	let td23;
    	let t45;
    	let td24;
    	let div14;
    	let input9;
    	let t46;
    	let tr17;
    	let td25;
    	let hr6;
    	let t47;
    	let tr18;
    	let td26;
    	let t49;
    	let td27;
    	let div15;
    	let input10;
    	let t50;
    	let tr19;
    	let td28;
    	let hr7;
    	let t51;
    	let tr20;
    	let td29;
    	let t53;
    	let td30;
    	let div16;
    	let input11;
    	let t54;
    	let tr21;
    	let td31;
    	let t55;
    	let td32;
    	let div18;
    	let div17;
    	let input12;
    	let input12_disabled_value;
    	let t56;
    	let span2;
    	let t58;
    	let tr22;
    	let td33;
    	let hr8;
    	let t59;
    	let tr23;
    	let td34;
    	let t61;
    	let td35;
    	let div19;
    	let input13;
    	let t62;
    	let tr24;
    	let td36;
    	let t63;
    	let td37;
    	let div21;
    	let div20;
    	let input14;
    	let input14_disabled_value;
    	let t64;
    	let span3;
    	let t66;
    	let tr25;
    	let td38;
    	let hr9;
    	let t67;
    	let tr26;
    	let td39;
    	let t69;
    	let td40;
    	let div22;
    	let input15;
    	let t70;
    	let tr27;
    	let td41;
    	let hr10;
    	let t71;
    	let tr28;
    	let td42;
    	let t73;
    	let td43;
    	let div23;
    	let input16;
    	let t74;
    	let tr29;
    	let td44;
    	let hr11;
    	let t75;
    	let tr30;
    	let td45;
    	let t77;
    	let td46;
    	let div24;
    	let input17;
    	let t78;
    	let tr31;
    	let td47;
    	let hr12;
    	let t79;
    	let tr32;
    	let td48;
    	let t81;
    	let td49;
    	let div25;
    	let input18;
    	let t82;
    	let tr33;
    	let td50;
    	let hr13;
    	let t83;
    	let tr34;
    	let td51;
    	let t85;
    	let td52;
    	let div26;
    	let input19;
    	let t86;
    	let tr35;
    	let td53;
    	let button1;
    	let t88;
    	let tr36;
    	let td54;
    	let button2;
    	let current;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 26,
    		blocks: [,,,]
    	};

    	handle_promise(/*getData*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			info.block.c();
    			t0 = space();
    			div29 = element("div");
    			div2 = element("div");
    			button0 = element("button");
    			i = element("i");
    			t1 = text(" 뒤로가기");
    			t2 = space();
    			div28 = element("div");
    			div27 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th = element("th");
    			h1 = element("h1");
    			u = element("u");
    			u.textContent = "Checklist";
    			t4 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "앵글";
    			t6 = space();
    			td1 = element("td");
    			div3 = element("div");
    			input0 = element("input");
    			t7 = space();
    			tr2 = element("tr");
    			td2 = element("td");
    			hr0 = element("hr");
    			t8 = space();
    			tr3 = element("tr");
    			td3 = element("td");
    			td3.textContent = "실외기 받침대";
    			t10 = space();
    			td4 = element("td");
    			div4 = element("div");
    			input1 = element("input");
    			t11 = space();
    			tr4 = element("tr");
    			td5 = element("td");
    			hr1 = element("hr");
    			t12 = space();
    			tr5 = element("tr");
    			td6 = element("td");
    			t13 = text("실외기 고정");
    			small = element("small");
    			small.textContent = "(컷팅반도)";
    			t15 = space();
    			td7 = element("td");
    			div5 = element("div");
    			input2 = element("input");
    			t16 = space();
    			tr6 = element("tr");
    			td8 = element("td");
    			hr2 = element("hr");
    			t17 = space();
    			tr7 = element("tr");
    			td9 = element("td");
    			td9.textContent = "배관종류";
    			t19 = space();
    			td10 = element("td");
    			t20 = space();
    			tr8 = element("tr");
    			td11 = element("td");
    			div7 = element("div");
    			div6 = element("div");
    			input3 = element("input");
    			t21 = space();
    			label0 = element("label");
    			label0.textContent = "동";
    			t23 = space();
    			input4 = element("input");
    			t24 = space();
    			label1 = element("label");
    			label1.textContent = "알루미늄";
    			t26 = space();
    			tr9 = element("tr");
    			td12 = element("td");
    			hr3 = element("hr");
    			t27 = space();
    			tr10 = element("tr");
    			td13 = element("td");
    			td13.textContent = "배관 연장";
    			t29 = space();
    			td14 = element("td");
    			div8 = element("div");
    			input5 = element("input");
    			t30 = space();
    			tr11 = element("tr");
    			td15 = element("td");
    			t31 = space();
    			td16 = element("td");
    			div10 = element("div");
    			div9 = element("div");
    			input6 = element("input");
    			t32 = space();
    			span0 = element("span");
    			span0.textContent = "m";
    			t34 = space();
    			tr12 = element("tr");
    			td17 = element("td");
    			hr4 = element("hr");
    			t35 = space();
    			tr13 = element("tr");
    			td18 = element("td");
    			td18.textContent = "주름 배관";
    			t37 = space();
    			td19 = element("td");
    			div11 = element("div");
    			input7 = element("input");
    			t38 = space();
    			tr14 = element("tr");
    			td20 = element("td");
    			t39 = space();
    			td21 = element("td");
    			div13 = element("div");
    			div12 = element("div");
    			input8 = element("input");
    			t40 = space();
    			span1 = element("span");
    			span1.textContent = "m";
    			t42 = space();
    			tr15 = element("tr");
    			td22 = element("td");
    			hr5 = element("hr");
    			t43 = space();
    			tr16 = element("tr");
    			td23 = element("td");
    			td23.textContent = "배관 용접";
    			t45 = space();
    			td24 = element("td");
    			div14 = element("div");
    			input9 = element("input");
    			t46 = space();
    			tr17 = element("tr");
    			td25 = element("td");
    			hr6 = element("hr");
    			t47 = space();
    			tr18 = element("tr");
    			td26 = element("td");
    			td26.textContent = "냉매 주입";
    			t49 = space();
    			td27 = element("td");
    			div15 = element("div");
    			input10 = element("input");
    			t50 = space();
    			tr19 = element("tr");
    			td28 = element("td");
    			hr7 = element("hr");
    			t51 = space();
    			tr20 = element("tr");
    			td29 = element("td");
    			td29.textContent = "배수 펌프";
    			t53 = space();
    			td30 = element("td");
    			div16 = element("div");
    			input11 = element("input");
    			t54 = space();
    			tr21 = element("tr");
    			td31 = element("td");
    			t55 = space();
    			td32 = element("td");
    			div18 = element("div");
    			div17 = element("div");
    			input12 = element("input");
    			t56 = space();
    			span2 = element("span");
    			span2.textContent = "m";
    			t58 = space();
    			tr22 = element("tr");
    			td33 = element("td");
    			hr8 = element("hr");
    			t59 = space();
    			tr23 = element("tr");
    			td34 = element("td");
    			td34.textContent = "추가 타공";
    			t61 = space();
    			td35 = element("td");
    			div19 = element("div");
    			input13 = element("input");
    			t62 = space();
    			tr24 = element("tr");
    			td36 = element("td");
    			t63 = space();
    			td37 = element("td");
    			div21 = element("div");
    			div20 = element("div");
    			input14 = element("input");
    			t64 = space();
    			span3 = element("span");
    			span3.textContent = "회";
    			t66 = space();
    			tr25 = element("tr");
    			td38 = element("td");
    			hr9 = element("hr");
    			t67 = space();
    			tr26 = element("tr");
    			td39 = element("td");
    			td39.textContent = "실외기 위험수당";
    			t69 = space();
    			td40 = element("td");
    			div22 = element("div");
    			input15 = element("input");
    			t70 = space();
    			tr27 = element("tr");
    			td41 = element("td");
    			hr10 = element("hr");
    			t71 = space();
    			tr28 = element("tr");
    			td42 = element("td");
    			td42.textContent = "실외기 배수 Kit";
    			t73 = space();
    			td43 = element("td");
    			div23 = element("div");
    			input16 = element("input");
    			t74 = space();
    			tr29 = element("tr");
    			td44 = element("td");
    			hr11 = element("hr");
    			t75 = space();
    			tr30 = element("tr");
    			td45 = element("td");
    			td45.textContent = "유니온";
    			t77 = space();
    			td46 = element("td");
    			div24 = element("div");
    			input17 = element("input");
    			t78 = space();
    			tr31 = element("tr");
    			td47 = element("td");
    			hr12 = element("hr");
    			t79 = space();
    			tr32 = element("tr");
    			td48 = element("td");
    			td48.textContent = "전원선";
    			t81 = space();
    			td49 = element("td");
    			div25 = element("div");
    			input18 = element("input");
    			t82 = space();
    			tr33 = element("tr");
    			td50 = element("td");
    			hr13 = element("hr");
    			t83 = space();
    			tr34 = element("tr");
    			td51 = element("td");
    			td51.textContent = "실외기 에어가이드";
    			t85 = space();
    			td52 = element("td");
    			div26 = element("div");
    			input19 = element("input");
    			t86 = space();
    			tr35 = element("tr");
    			td53 = element("td");
    			button1 = element("button");
    			button1.textContent = "완료";
    			t88 = space();
    			tr36 = element("tr");
    			td54 = element("td");
    			button2 = element("button");
    			button2.textContent = "뒤로가기";
    			attr_dev(div0, "class", "container");
    			add_location(div0, file$3, 33, 2, 812);
    			attr_dev(div1, "class", "container-fluid bg-light shadow-sm sticky-top");
    			add_location(div1, file$3, 32, 0, 750);
    			attr_dev(i, "class", "fas fa-chevron-left");
    			add_location(i, file$3, 101, 7, 2897);
    			attr_dev(button0, "class", "btn btn-light btn-lg btn-rounded");
    			add_location(button0, file$3, 100, 4, 2818);
    			attr_dev(div2, "class", "d-flex py-3");
    			add_location(div2, file$3, 99, 2, 2788);
    			add_location(u, file$3, 111, 31, 3159);
    			attr_dev(h1, "class", "my-4");
    			add_location(h1, file$3, 111, 14, 3142);
    			attr_dev(th, "colspan", "2");
    			add_location(th, file$3, 110, 12, 3111);
    			add_location(tr0, file$3, 109, 10, 3094);
    			add_location(thead, file$3, 108, 8, 3076);
    			add_location(td0, file$3, 117, 12, 3275);
    			attr_dev(input0, "class", "form-check-input");
    			attr_dev(input0, "type", "checkbox");
    			input0.__value = "";
    			input0.value = input0.__value;
    			add_location(input0, file$3, 120, 16, 3395);
    			attr_dev(div3, "class", "form-check d-flex justify-content-end");
    			add_location(div3, file$3, 119, 14, 3327);
    			attr_dev(td1, "class", "");
    			add_location(td1, file$3, 118, 12, 3299);
    			add_location(tr1, file$3, 116, 10, 3258);
    			add_location(hr0, file$3, 130, 28, 3671);
    			attr_dev(td2, "colspan", "2");
    			add_location(td2, file$3, 130, 12, 3655);
    			add_location(tr2, file$3, 129, 10, 3638);
    			add_location(td3, file$3, 134, 12, 3727);
    			attr_dev(input1, "class", "form-check-input");
    			attr_dev(input1, "type", "checkbox");
    			input1.__value = "";
    			input1.value = input1.__value;
    			add_location(input1, file$3, 137, 16, 3843);
    			attr_dev(div4, "class", "form-check d-flex justify-content-end");
    			add_location(div4, file$3, 136, 14, 3775);
    			add_location(td4, file$3, 135, 12, 3756);
    			add_location(tr3, file$3, 133, 10, 3710);
    			add_location(hr1, file$3, 148, 28, 4120);
    			attr_dev(td5, "colspan", "2");
    			add_location(td5, file$3, 148, 12, 4104);
    			add_location(tr4, file$3, 147, 10, 4087);
    			add_location(small, file$3, 151, 22, 4185);
    			add_location(td6, file$3, 151, 12, 4175);
    			attr_dev(input2, "class", "form-check-input");
    			attr_dev(input2, "type", "checkbox");
    			input2.__value = "";
    			input2.value = input2.__value;
    			add_location(input2, file$3, 154, 16, 4311);
    			attr_dev(div5, "class", "form-check d-flex justify-content-end");
    			add_location(div5, file$3, 153, 14, 4243);
    			add_location(td7, file$3, 152, 12, 4224);
    			add_location(tr5, file$3, 150, 10, 4158);
    			add_location(hr2, file$3, 165, 28, 4589);
    			attr_dev(td8, "colspan", "2");
    			add_location(td8, file$3, 165, 12, 4573);
    			add_location(tr6, file$3, 164, 10, 4556);
    			add_location(td9, file$3, 168, 12, 4644);
    			add_location(td10, file$3, 169, 12, 4670);
    			add_location(tr7, file$3, 167, 10, 4627);
    			attr_dev(input3, "type", "radio");
    			attr_dev(input3, "class", "btn-check");
    			attr_dev(input3, "name", "pipetype");
    			attr_dev(input3, "id", "pipetype1");
    			attr_dev(input3, "autocomplete", "off");
    			add_location(input3, file$3, 175, 18, 4850);
    			attr_dev(label0, "class", "btn btn-light");
    			attr_dev(label0, "for", "pipetype1");
    			add_location(label0, file$3, 185, 18, 5187);
    			attr_dev(input4, "type", "radio");
    			attr_dev(input4, "class", "btn-check");
    			attr_dev(input4, "name", "pipetype");
    			attr_dev(input4, "id", "pipetype2");
    			attr_dev(input4, "autocomplete", "off");
    			add_location(input4, file$3, 187, 18, 5261);
    			attr_dev(label1, "class", "btn btn-light");
    			attr_dev(label1, "for", "pipetype2");
    			add_location(label1, file$3, 197, 18, 5601);
    			attr_dev(div6, "class", "btn-group");
    			add_location(div6, file$3, 174, 16, 4808);
    			attr_dev(div7, "class", "d-flex justify-content-end");
    			add_location(div7, file$3, 173, 14, 4751);
    			attr_dev(td11, "colspan", "2");
    			add_location(td11, file$3, 172, 12, 4720);
    			add_location(tr8, file$3, 171, 10, 4703);
    			add_location(hr3, file$3, 204, 28, 5781);
    			attr_dev(td12, "colspan", "2");
    			add_location(td12, file$3, 204, 12, 5765);
    			add_location(tr9, file$3, 203, 10, 5748);
    			add_location(td13, file$3, 207, 12, 5836);
    			attr_dev(input5, "class", "form-check-input");
    			attr_dev(input5, "type", "checkbox");
    			input5.__value = "";
    			input5.value = input5.__value;
    			add_location(input5, file$3, 210, 16, 5950);
    			attr_dev(div8, "class", "form-check d-flex justify-content-end");
    			add_location(div8, file$3, 209, 14, 5882);
    			add_location(td14, file$3, 208, 12, 5863);
    			add_location(tr10, file$3, 206, 10, 5819);
    			add_location(td15, file$3, 220, 12, 6216);
    			attr_dev(input6, "type", "number");
    			attr_dev(input6, "class", "form-control");
    			attr_dev(input6, "placeholder", "연장 길이");
    			attr_dev(input6, "aria-label", "연장 길이");
    			input6.disabled = input6_disabled_value = !/*formData*/ ctx[0].pipe_extend;
    			attr_dev(input6, "aria-describedby", "pipelength");
    			add_location(input6, file$3, 224, 18, 6373);
    			attr_dev(span0, "class", "input-group-text");
    			attr_dev(span0, "id", "pipelength");
    			add_location(span0, file$3, 233, 18, 6737);
    			attr_dev(div9, "class", "input-group input-group-sm");
    			add_location(div9, file$3, 223, 16, 6314);
    			attr_dev(div10, "class", "d-flex justify-content-center");
    			add_location(div10, file$3, 222, 14, 6254);
    			add_location(td16, file$3, 221, 12, 6235);
    			add_location(tr11, file$3, 219, 10, 6199);
    			add_location(hr4, file$3, 239, 28, 6916);
    			attr_dev(td17, "colspan", "2");
    			add_location(td17, file$3, 239, 12, 6900);
    			add_location(tr12, file$3, 238, 10, 6883);
    			add_location(td18, file$3, 242, 12, 6971);
    			attr_dev(input7, "class", "form-check-input");
    			attr_dev(input7, "type", "checkbox");
    			input7.__value = "";
    			input7.value = input7.__value;
    			add_location(input7, file$3, 245, 16, 7085);
    			attr_dev(div11, "class", "form-check d-flex justify-content-end");
    			add_location(div11, file$3, 244, 14, 7017);
    			add_location(td19, file$3, 243, 12, 6998);
    			add_location(tr13, file$3, 241, 10, 6954);
    			add_location(td20, file$3, 255, 12, 7347);
    			attr_dev(input8, "type", "number");
    			attr_dev(input8, "class", "form-control");
    			attr_dev(input8, "placeholder", "필요 길이");
    			attr_dev(input8, "aria-label", "필요 길이");
    			input8.disabled = input8_disabled_value = !/*formData*/ ctx[0].wrinkle;
    			attr_dev(input8, "aria-describedby", "pipelength");
    			add_location(input8, file$3, 259, 18, 7504);
    			attr_dev(span1, "class", "input-group-text");
    			attr_dev(span1, "id", "pipelength");
    			add_location(span1, file$3, 268, 18, 7860);
    			attr_dev(div12, "class", "input-group input-group-sm");
    			add_location(div12, file$3, 258, 16, 7445);
    			attr_dev(div13, "class", "d-flex justify-content-center");
    			add_location(div13, file$3, 257, 14, 7385);
    			add_location(td21, file$3, 256, 12, 7366);
    			add_location(tr14, file$3, 254, 10, 7330);
    			add_location(hr5, file$3, 274, 28, 8039);
    			attr_dev(td22, "colspan", "2");
    			add_location(td22, file$3, 274, 12, 8023);
    			add_location(tr15, file$3, 273, 10, 8006);
    			add_location(td23, file$3, 277, 12, 8094);
    			attr_dev(input9, "class", "form-check-input");
    			attr_dev(input9, "type", "checkbox");
    			input9.__value = "";
    			input9.value = input9.__value;
    			add_location(input9, file$3, 280, 16, 8208);
    			attr_dev(div14, "class", "form-check d-flex justify-content-end");
    			add_location(div14, file$3, 279, 14, 8140);
    			add_location(td24, file$3, 278, 12, 8121);
    			add_location(tr16, file$3, 276, 10, 8077);
    			add_location(hr6, file$3, 290, 28, 8486);
    			attr_dev(td25, "colspan", "2");
    			add_location(td25, file$3, 290, 12, 8470);
    			add_location(tr17, file$3, 289, 10, 8453);
    			add_location(td26, file$3, 293, 12, 8541);
    			attr_dev(input10, "class", "form-check-input");
    			attr_dev(input10, "type", "checkbox");
    			input10.__value = "";
    			input10.value = input10.__value;
    			add_location(input10, file$3, 296, 16, 8655);
    			attr_dev(div15, "class", "form-check d-flex justify-content-end");
    			add_location(div15, file$3, 295, 14, 8587);
    			add_location(td27, file$3, 294, 12, 8568);
    			add_location(tr18, file$3, 292, 10, 8524);
    			add_location(hr7, file$3, 306, 28, 8929);
    			attr_dev(td28, "colspan", "2");
    			add_location(td28, file$3, 306, 12, 8913);
    			add_location(tr19, file$3, 305, 10, 8896);
    			add_location(td29, file$3, 309, 12, 8984);
    			attr_dev(input11, "class", "form-check-input");
    			attr_dev(input11, "type", "checkbox");
    			input11.__value = "";
    			input11.value = input11.__value;
    			add_location(input11, file$3, 312, 16, 9098);
    			attr_dev(div16, "class", "form-check d-flex justify-content-end");
    			add_location(div16, file$3, 311, 14, 9030);
    			add_location(td30, file$3, 310, 12, 9011);
    			add_location(tr20, file$3, 308, 10, 8967);
    			add_location(td31, file$3, 322, 12, 9363);
    			attr_dev(input12, "type", "number");
    			attr_dev(input12, "class", "form-control");
    			attr_dev(input12, "placeholder", "배관 길이");
    			attr_dev(input12, "aria-label", "배관 길이");
    			input12.disabled = input12_disabled_value = !/*formData*/ ctx[0].drain_pump;
    			attr_dev(input12, "aria-describedby", "pipelength");
    			add_location(input12, file$3, 326, 18, 9520);
    			attr_dev(span2, "class", "input-group-text");
    			attr_dev(span2, "id", "pipelength");
    			add_location(span2, file$3, 335, 18, 9882);
    			attr_dev(div17, "class", "input-group input-group-sm");
    			add_location(div17, file$3, 325, 16, 9461);
    			attr_dev(div18, "class", "d-flex justify-content-center");
    			add_location(div18, file$3, 324, 14, 9401);
    			add_location(td32, file$3, 323, 12, 9382);
    			add_location(tr21, file$3, 321, 10, 9346);
    			add_location(hr8, file$3, 342, 28, 10062);
    			attr_dev(td33, "colspan", "2");
    			add_location(td33, file$3, 342, 12, 10046);
    			add_location(tr22, file$3, 341, 10, 10029);
    			add_location(td34, file$3, 345, 12, 10117);
    			attr_dev(input13, "class", "form-check-input");
    			attr_dev(input13, "type", "checkbox");
    			input13.__value = "";
    			input13.value = input13.__value;
    			add_location(input13, file$3, 348, 16, 10231);
    			attr_dev(div19, "class", "form-check d-flex justify-content-end");
    			add_location(div19, file$3, 347, 14, 10163);
    			add_location(td35, file$3, 346, 12, 10144);
    			add_location(tr23, file$3, 344, 10, 10100);
    			add_location(td36, file$3, 358, 12, 10490);
    			attr_dev(input14, "type", "number");
    			attr_dev(input14, "class", "form-control");
    			attr_dev(input14, "placeholder", "타공 횟수");
    			attr_dev(input14, "aria-label", "타공 횟수");
    			input14.disabled = input14_disabled_value = !/*formData*/ ctx[0].hole;
    			attr_dev(input14, "aria-describedby", "pipelength");
    			add_location(input14, file$3, 362, 18, 10647);
    			attr_dev(span3, "class", "input-group-text");
    			attr_dev(span3, "id", "pipelength");
    			add_location(span3, file$3, 371, 18, 10997);
    			attr_dev(div20, "class", "input-group input-group-sm");
    			add_location(div20, file$3, 361, 16, 10588);
    			attr_dev(div21, "class", "d-flex justify-content-center");
    			add_location(div21, file$3, 360, 14, 10528);
    			add_location(td37, file$3, 359, 12, 10509);
    			add_location(tr24, file$3, 357, 10, 10473);
    			add_location(hr9, file$3, 377, 28, 11176);
    			attr_dev(td38, "colspan", "2");
    			add_location(td38, file$3, 377, 12, 11160);
    			add_location(tr25, file$3, 376, 10, 11143);
    			add_location(td39, file$3, 380, 12, 11231);
    			attr_dev(input15, "class", "form-check-input");
    			attr_dev(input15, "type", "checkbox");
    			input15.__value = "";
    			input15.value = input15.__value;
    			add_location(input15, file$3, 383, 16, 11348);
    			attr_dev(div22, "class", "form-check d-flex justify-content-end");
    			add_location(div22, file$3, 382, 14, 11280);
    			add_location(td40, file$3, 381, 12, 11261);
    			add_location(tr26, file$3, 379, 10, 11214);
    			add_location(hr10, file$3, 393, 28, 11629);
    			attr_dev(td41, "colspan", "2");
    			add_location(td41, file$3, 393, 12, 11613);
    			add_location(tr27, file$3, 392, 10, 11596);
    			add_location(td42, file$3, 396, 12, 11684);
    			attr_dev(input16, "class", "form-check-input");
    			attr_dev(input16, "type", "checkbox");
    			input16.__value = "";
    			input16.value = input16.__value;
    			add_location(input16, file$3, 399, 16, 11803);
    			attr_dev(div23, "class", "form-check d-flex justify-content-end");
    			add_location(div23, file$3, 398, 14, 11735);
    			add_location(td43, file$3, 397, 12, 11716);
    			add_location(tr28, file$3, 395, 10, 11667);
    			add_location(hr11, file$3, 409, 28, 12083);
    			attr_dev(td44, "colspan", "2");
    			add_location(td44, file$3, 409, 12, 12067);
    			add_location(tr29, file$3, 408, 10, 12050);
    			add_location(td45, file$3, 412, 12, 12138);
    			attr_dev(input17, "class", "form-check-input");
    			attr_dev(input17, "type", "checkbox");
    			input17.__value = "";
    			input17.value = input17.__value;
    			add_location(input17, file$3, 415, 16, 12250);
    			attr_dev(div24, "class", "form-check d-flex justify-content-end");
    			add_location(div24, file$3, 414, 14, 12182);
    			add_location(td46, file$3, 413, 12, 12163);
    			add_location(tr30, file$3, 411, 10, 12121);
    			add_location(hr12, file$3, 425, 28, 12526);
    			attr_dev(td47, "colspan", "2");
    			add_location(td47, file$3, 425, 12, 12510);
    			add_location(tr31, file$3, 424, 10, 12493);
    			add_location(td48, file$3, 428, 12, 12581);
    			attr_dev(input18, "class", "form-check-input");
    			attr_dev(input18, "type", "checkbox");
    			input18.__value = "";
    			input18.value = input18.__value;
    			add_location(input18, file$3, 431, 16, 12693);
    			attr_dev(div25, "class", "form-check d-flex justify-content-end");
    			add_location(div25, file$3, 430, 14, 12625);
    			add_location(td49, file$3, 429, 12, 12606);
    			add_location(tr32, file$3, 427, 10, 12564);
    			add_location(hr13, file$3, 441, 28, 12974);
    			attr_dev(td50, "colspan", "2");
    			add_location(td50, file$3, 441, 12, 12958);
    			add_location(tr33, file$3, 440, 10, 12941);
    			add_location(td51, file$3, 444, 12, 13029);
    			attr_dev(input19, "class", "form-check-input");
    			attr_dev(input19, "type", "checkbox");
    			input19.__value = "";
    			input19.value = input19.__value;
    			add_location(input19, file$3, 447, 16, 13147);
    			attr_dev(div26, "class", "form-check d-flex justify-content-end");
    			add_location(div26, file$3, 446, 14, 13079);
    			add_location(td52, file$3, 445, 12, 13060);
    			add_location(tr34, file$3, 443, 10, 13012);
    			attr_dev(button1, "class", "btn btn-success btn-lg w-100 mt-5 mb-0");
    			add_location(button1, file$3, 459, 14, 13445);
    			attr_dev(td53, "colspan", "2");
    			add_location(td53, file$3, 458, 12, 13414);
    			add_location(tr35, file$3, 457, 10, 13397);
    			attr_dev(button2, "class", "btn btn-light w-100 m-0");
    			add_location(button2, file$3, 466, 14, 13636);
    			attr_dev(td54, "colspan", "2");
    			add_location(td54, file$3, 465, 12, 13605);
    			add_location(tr36, file$3, 464, 10, 13588);
    			add_location(tbody, file$3, 115, 8, 3240);
    			attr_dev(table, "class", "table table-borderless table-sm");
    			add_location(table, file$3, 107, 6, 3020);
    			attr_dev(div27, "class", "card-body");
    			add_location(div27, file$3, 106, 4, 2990);
    			attr_dev(div28, "class", "card mb-5");
    			add_location(div28, file$3, 105, 2, 2962);
    			attr_dev(div29, "class", "container pt-2");
    			add_location(div29, file$3, 98, 0, 2757);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			info.block.m(div0, info.anchor = null);
    			info.mount = () => div0;
    			info.anchor = null;
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div29, anchor);
    			append_dev(div29, div2);
    			append_dev(div2, button0);
    			append_dev(button0, i);
    			append_dev(button0, t1);
    			append_dev(div29, t2);
    			append_dev(div29, div28);
    			append_dev(div28, div27);
    			append_dev(div27, table);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th);
    			append_dev(th, h1);
    			append_dev(h1, u);
    			append_dev(table, t4);
    			append_dev(table, tbody);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t6);
    			append_dev(tr1, td1);
    			append_dev(td1, div3);
    			append_dev(div3, input0);
    			input0.checked = /*formData*/ ctx[0].angle;
    			append_dev(tbody, t7);
    			append_dev(tbody, tr2);
    			append_dev(tr2, td2);
    			append_dev(td2, hr0);
    			append_dev(tbody, t8);
    			append_dev(tbody, tr3);
    			append_dev(tr3, td3);
    			append_dev(tr3, t10);
    			append_dev(tr3, td4);
    			append_dev(td4, div4);
    			append_dev(div4, input1);
    			input1.checked = /*formData*/ ctx[0].stand;
    			append_dev(tbody, t11);
    			append_dev(tbody, tr4);
    			append_dev(tr4, td5);
    			append_dev(td5, hr1);
    			append_dev(tbody, t12);
    			append_dev(tbody, tr5);
    			append_dev(tr5, td6);
    			append_dev(td6, t13);
    			append_dev(td6, small);
    			append_dev(tr5, t15);
    			append_dev(tr5, td7);
    			append_dev(td7, div5);
    			append_dev(div5, input2);
    			input2.checked = /*formData*/ ctx[0].holder;
    			append_dev(tbody, t16);
    			append_dev(tbody, tr6);
    			append_dev(tr6, td8);
    			append_dev(td8, hr2);
    			append_dev(tbody, t17);
    			append_dev(tbody, tr7);
    			append_dev(tr7, td9);
    			append_dev(tr7, t19);
    			append_dev(tr7, td10);
    			append_dev(tbody, t20);
    			append_dev(tbody, tr8);
    			append_dev(tr8, td11);
    			append_dev(td11, div7);
    			append_dev(div7, div6);
    			append_dev(div6, input3);
    			append_dev(div6, t21);
    			append_dev(div6, label0);
    			append_dev(div6, t23);
    			append_dev(div6, input4);
    			append_dev(div6, t24);
    			append_dev(div6, label1);
    			append_dev(tbody, t26);
    			append_dev(tbody, tr9);
    			append_dev(tr9, td12);
    			append_dev(td12, hr3);
    			append_dev(tbody, t27);
    			append_dev(tbody, tr10);
    			append_dev(tr10, td13);
    			append_dev(tr10, t29);
    			append_dev(tr10, td14);
    			append_dev(td14, div8);
    			append_dev(div8, input5);
    			input5.checked = /*formData*/ ctx[0].pipe_extend;
    			append_dev(tbody, t30);
    			append_dev(tbody, tr11);
    			append_dev(tr11, td15);
    			append_dev(tr11, t31);
    			append_dev(tr11, td16);
    			append_dev(td16, div10);
    			append_dev(div10, div9);
    			append_dev(div9, input6);
    			set_input_value(input6, /*formData*/ ctx[0].pipe_extend_length);
    			append_dev(div9, t32);
    			append_dev(div9, span0);
    			append_dev(tbody, t34);
    			append_dev(tbody, tr12);
    			append_dev(tr12, td17);
    			append_dev(td17, hr4);
    			append_dev(tbody, t35);
    			append_dev(tbody, tr13);
    			append_dev(tr13, td18);
    			append_dev(tr13, t37);
    			append_dev(tr13, td19);
    			append_dev(td19, div11);
    			append_dev(div11, input7);
    			input7.checked = /*formData*/ ctx[0].wrinkle;
    			append_dev(tbody, t38);
    			append_dev(tbody, tr14);
    			append_dev(tr14, td20);
    			append_dev(tr14, t39);
    			append_dev(tr14, td21);
    			append_dev(td21, div13);
    			append_dev(div13, div12);
    			append_dev(div12, input8);
    			set_input_value(input8, /*formData*/ ctx[0].wrinkle_length);
    			append_dev(div12, t40);
    			append_dev(div12, span1);
    			append_dev(tbody, t42);
    			append_dev(tbody, tr15);
    			append_dev(tr15, td22);
    			append_dev(td22, hr5);
    			append_dev(tbody, t43);
    			append_dev(tbody, tr16);
    			append_dev(tr16, td23);
    			append_dev(tr16, t45);
    			append_dev(tr16, td24);
    			append_dev(td24, div14);
    			append_dev(div14, input9);
    			input9.checked = /*formData*/ ctx[0].welding;
    			append_dev(tbody, t46);
    			append_dev(tbody, tr17);
    			append_dev(tr17, td25);
    			append_dev(td25, hr6);
    			append_dev(tbody, t47);
    			append_dev(tbody, tr18);
    			append_dev(tr18, td26);
    			append_dev(tr18, t49);
    			append_dev(tr18, td27);
    			append_dev(td27, div15);
    			append_dev(div15, input10);
    			input10.checked = /*formData*/ ctx[0].gas;
    			append_dev(tbody, t50);
    			append_dev(tbody, tr19);
    			append_dev(tr19, td28);
    			append_dev(td28, hr7);
    			append_dev(tbody, t51);
    			append_dev(tbody, tr20);
    			append_dev(tr20, td29);
    			append_dev(tr20, t53);
    			append_dev(tr20, td30);
    			append_dev(td30, div16);
    			append_dev(div16, input11);
    			input11.checked = /*formData*/ ctx[0].drain_pump;
    			append_dev(tbody, t54);
    			append_dev(tbody, tr21);
    			append_dev(tr21, td31);
    			append_dev(tr21, t55);
    			append_dev(tr21, td32);
    			append_dev(td32, div18);
    			append_dev(div18, div17);
    			append_dev(div17, input12);
    			set_input_value(input12, /*formData*/ ctx[0].drain_pump_length);
    			append_dev(div17, t56);
    			append_dev(div17, span2);
    			append_dev(tbody, t58);
    			append_dev(tbody, tr22);
    			append_dev(tr22, td33);
    			append_dev(td33, hr8);
    			append_dev(tbody, t59);
    			append_dev(tbody, tr23);
    			append_dev(tr23, td34);
    			append_dev(tr23, t61);
    			append_dev(tr23, td35);
    			append_dev(td35, div19);
    			append_dev(div19, input13);
    			input13.checked = /*formData*/ ctx[0].hole;
    			append_dev(tbody, t62);
    			append_dev(tbody, tr24);
    			append_dev(tr24, td36);
    			append_dev(tr24, t63);
    			append_dev(tr24, td37);
    			append_dev(td37, div21);
    			append_dev(div21, div20);
    			append_dev(div20, input14);
    			set_input_value(input14, /*formData*/ ctx[0].hole_amount);
    			append_dev(div20, t64);
    			append_dev(div20, span3);
    			append_dev(tbody, t66);
    			append_dev(tbody, tr25);
    			append_dev(tr25, td38);
    			append_dev(td38, hr9);
    			append_dev(tbody, t67);
    			append_dev(tbody, tr26);
    			append_dev(tr26, td39);
    			append_dev(tr26, t69);
    			append_dev(tr26, td40);
    			append_dev(td40, div22);
    			append_dev(div22, input15);
    			input15.checked = /*formData*/ ctx[0].danger_fee;
    			append_dev(tbody, t70);
    			append_dev(tbody, tr27);
    			append_dev(tr27, td41);
    			append_dev(td41, hr10);
    			append_dev(tbody, t71);
    			append_dev(tbody, tr28);
    			append_dev(tr28, td42);
    			append_dev(tr28, t73);
    			append_dev(tr28, td43);
    			append_dev(td43, div23);
    			append_dev(div23, input16);
    			input16.checked = /*formData*/ ctx[0].drain_kit;
    			append_dev(tbody, t74);
    			append_dev(tbody, tr29);
    			append_dev(tr29, td44);
    			append_dev(td44, hr11);
    			append_dev(tbody, t75);
    			append_dev(tbody, tr30);
    			append_dev(tr30, td45);
    			append_dev(tr30, t77);
    			append_dev(tr30, td46);
    			append_dev(td46, div24);
    			append_dev(div24, input17);
    			input17.checked = /*formData*/ ctx[0].union;
    			append_dev(tbody, t78);
    			append_dev(tbody, tr31);
    			append_dev(tr31, td47);
    			append_dev(td47, hr12);
    			append_dev(tbody, t79);
    			append_dev(tbody, tr32);
    			append_dev(tr32, td48);
    			append_dev(tr32, t81);
    			append_dev(tr32, td49);
    			append_dev(td49, div25);
    			append_dev(div25, input18);
    			input18.checked = /*formData*/ ctx[0].power_line;
    			append_dev(tbody, t82);
    			append_dev(tbody, tr33);
    			append_dev(tr33, td50);
    			append_dev(td50, hr13);
    			append_dev(tbody, t83);
    			append_dev(tbody, tr34);
    			append_dev(tr34, td51);
    			append_dev(tr34, t85);
    			append_dev(tr34, td52);
    			append_dev(td52, div26);
    			append_dev(div26, input19);
    			input19.checked = /*formData*/ ctx[0].pipe_extend;
    			append_dev(tbody, t86);
    			append_dev(tbody, tr35);
    			append_dev(tr35, td53);
    			append_dev(td53, button1);
    			append_dev(tbody, t88);
    			append_dev(tbody, tr36);
    			append_dev(tr36, td54);
    			append_dev(td54, button2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[3], false, false, false),
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[4]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[5]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[6]),
    					listen_dev(input3, "change", /*change_handler*/ ctx[7], false, false, false),
    					listen_dev(input4, "change", /*change_handler_1*/ ctx[8], false, false, false),
    					listen_dev(input5, "change", /*input5_change_handler*/ ctx[9]),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[10]),
    					listen_dev(input7, "change", /*input7_change_handler*/ ctx[11]),
    					listen_dev(input8, "input", /*input8_input_handler*/ ctx[12]),
    					listen_dev(input9, "change", /*input9_change_handler*/ ctx[13]),
    					listen_dev(input10, "change", /*input10_change_handler*/ ctx[14]),
    					listen_dev(input11, "change", /*input11_change_handler*/ ctx[15]),
    					listen_dev(input12, "input", /*input12_input_handler*/ ctx[16]),
    					listen_dev(input13, "change", /*input13_change_handler*/ ctx[17]),
    					listen_dev(input14, "input", /*input14_input_handler*/ ctx[18]),
    					listen_dev(input15, "change", /*input15_change_handler*/ ctx[19]),
    					listen_dev(input16, "change", /*input16_change_handler*/ ctx[20]),
    					listen_dev(input17, "change", /*input17_change_handler*/ ctx[21]),
    					listen_dev(input18, "change", /*input18_change_handler*/ ctx[22]),
    					listen_dev(input19, "change", /*input19_change_handler*/ ctx[23]),
    					listen_dev(button2, "click", /*click_handler_1*/ ctx[24], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);

    			if (dirty & /*formData*/ 1) {
    				input0.checked = /*formData*/ ctx[0].angle;
    			}

    			if (dirty & /*formData*/ 1) {
    				input1.checked = /*formData*/ ctx[0].stand;
    			}

    			if (dirty & /*formData*/ 1) {
    				input2.checked = /*formData*/ ctx[0].holder;
    			}

    			if (dirty & /*formData*/ 1) {
    				input5.checked = /*formData*/ ctx[0].pipe_extend;
    			}

    			if (!current || dirty & /*formData*/ 1 && input6_disabled_value !== (input6_disabled_value = !/*formData*/ ctx[0].pipe_extend)) {
    				prop_dev(input6, "disabled", input6_disabled_value);
    			}

    			if (dirty & /*formData*/ 1 && to_number(input6.value) !== /*formData*/ ctx[0].pipe_extend_length) {
    				set_input_value(input6, /*formData*/ ctx[0].pipe_extend_length);
    			}

    			if (dirty & /*formData*/ 1) {
    				input7.checked = /*formData*/ ctx[0].wrinkle;
    			}

    			if (!current || dirty & /*formData*/ 1 && input8_disabled_value !== (input8_disabled_value = !/*formData*/ ctx[0].wrinkle)) {
    				prop_dev(input8, "disabled", input8_disabled_value);
    			}

    			if (dirty & /*formData*/ 1 && to_number(input8.value) !== /*formData*/ ctx[0].wrinkle_length) {
    				set_input_value(input8, /*formData*/ ctx[0].wrinkle_length);
    			}

    			if (dirty & /*formData*/ 1) {
    				input9.checked = /*formData*/ ctx[0].welding;
    			}

    			if (dirty & /*formData*/ 1) {
    				input10.checked = /*formData*/ ctx[0].gas;
    			}

    			if (dirty & /*formData*/ 1) {
    				input11.checked = /*formData*/ ctx[0].drain_pump;
    			}

    			if (!current || dirty & /*formData*/ 1 && input12_disabled_value !== (input12_disabled_value = !/*formData*/ ctx[0].drain_pump)) {
    				prop_dev(input12, "disabled", input12_disabled_value);
    			}

    			if (dirty & /*formData*/ 1 && to_number(input12.value) !== /*formData*/ ctx[0].drain_pump_length) {
    				set_input_value(input12, /*formData*/ ctx[0].drain_pump_length);
    			}

    			if (dirty & /*formData*/ 1) {
    				input13.checked = /*formData*/ ctx[0].hole;
    			}

    			if (!current || dirty & /*formData*/ 1 && input14_disabled_value !== (input14_disabled_value = !/*formData*/ ctx[0].hole)) {
    				prop_dev(input14, "disabled", input14_disabled_value);
    			}

    			if (dirty & /*formData*/ 1 && to_number(input14.value) !== /*formData*/ ctx[0].hole_amount) {
    				set_input_value(input14, /*formData*/ ctx[0].hole_amount);
    			}

    			if (dirty & /*formData*/ 1) {
    				input15.checked = /*formData*/ ctx[0].danger_fee;
    			}

    			if (dirty & /*formData*/ 1) {
    				input16.checked = /*formData*/ ctx[0].drain_kit;
    			}

    			if (dirty & /*formData*/ 1) {
    				input17.checked = /*formData*/ ctx[0].union;
    			}

    			if (dirty & /*formData*/ 1) {
    				input18.checked = /*formData*/ ctx[0].power_line;
    			}

    			if (dirty & /*formData*/ 1) {
    				input19.checked = /*formData*/ ctx[0].pipe_extend;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			info.block.d();
    			info.token = null;
    			info = null;
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div29);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots("Viewer", slots, []);
    	let { params = {} } = $$props;
    	const requestNo = params.request_no;
    	const getData = getRequest(requestNo);

    	var formData = {
    		angle: false,
    		stand: false,
    		holder: false,
    		pipe_type: undefined,
    		pipe_extend: false,
    		pipe_extend_length: undefined,
    		wrinkle: false,
    		wrinkle_length: undefined,
    		welding: false,
    		gas: false,
    		drain_pump: false,
    		drain_pump_length: undefined,
    		hole: false,
    		hole_amount: undefined,
    		danger_fee: false,
    		drain_kit: false,
    		union: false,
    		power_line: false,
    		air_guide: false
    	};

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Viewer> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => pop();

    	function input0_change_handler() {
    		formData.angle = this.checked;
    		$$invalidate(0, formData);
    	}

    	function input1_change_handler() {
    		formData.stand = this.checked;
    		$$invalidate(0, formData);
    	}

    	function input2_change_handler() {
    		formData.holder = this.checked;
    		$$invalidate(0, formData);
    	}

    	const change_handler = () => {
    		$$invalidate(0, formData.pipe_type = "동", formData);
    	};

    	const change_handler_1 = () => {
    		$$invalidate(0, formData.pipe_type = "알루미늄", formData);
    	};

    	function input5_change_handler() {
    		formData.pipe_extend = this.checked;
    		$$invalidate(0, formData);
    	}

    	function input6_input_handler() {
    		formData.pipe_extend_length = to_number(this.value);
    		$$invalidate(0, formData);
    	}

    	function input7_change_handler() {
    		formData.wrinkle = this.checked;
    		$$invalidate(0, formData);
    	}

    	function input8_input_handler() {
    		formData.wrinkle_length = to_number(this.value);
    		$$invalidate(0, formData);
    	}

    	function input9_change_handler() {
    		formData.welding = this.checked;
    		$$invalidate(0, formData);
    	}

    	function input10_change_handler() {
    		formData.gas = this.checked;
    		$$invalidate(0, formData);
    	}

    	function input11_change_handler() {
    		formData.drain_pump = this.checked;
    		$$invalidate(0, formData);
    	}

    	function input12_input_handler() {
    		formData.drain_pump_length = to_number(this.value);
    		$$invalidate(0, formData);
    	}

    	function input13_change_handler() {
    		formData.hole = this.checked;
    		$$invalidate(0, formData);
    	}

    	function input14_input_handler() {
    		formData.hole_amount = to_number(this.value);
    		$$invalidate(0, formData);
    	}

    	function input15_change_handler() {
    		formData.danger_fee = this.checked;
    		$$invalidate(0, formData);
    	}

    	function input16_change_handler() {
    		formData.drain_kit = this.checked;
    		$$invalidate(0, formData);
    	}

    	function input17_change_handler() {
    		formData.union = this.checked;
    		$$invalidate(0, formData);
    	}

    	function input18_change_handler() {
    		formData.power_line = this.checked;
    		$$invalidate(0, formData);
    	}

    	function input19_change_handler() {
    		formData.pipe_extend = this.checked;
    		$$invalidate(0, formData);
    	}

    	const click_handler_1 = () => pop();

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(2, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		pop,
    		getRequest,
    		ImageHeader,
    		params,
    		requestNo,
    		getData,
    		formData
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(2, params = $$props.params);
    		if ("formData" in $$props) $$invalidate(0, formData = $$props.formData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		formData,
    		getData,
    		params,
    		click_handler,
    		input0_change_handler,
    		input1_change_handler,
    		input2_change_handler,
    		change_handler,
    		change_handler_1,
    		input5_change_handler,
    		input6_input_handler,
    		input7_change_handler,
    		input8_input_handler,
    		input9_change_handler,
    		input10_change_handler,
    		input11_change_handler,
    		input12_input_handler,
    		input13_change_handler,
    		input14_input_handler,
    		input15_change_handler,
    		input16_change_handler,
    		input17_change_handler,
    		input18_change_handler,
    		input19_change_handler,
    		click_handler_1
    	];
    }

    class Viewer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { params: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Viewer",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get params() {
    		throw new Error("<Viewer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Viewer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/NotFound.svelte generated by Svelte v3.38.2 */

    const file$2 = "src/routes/NotFound.svelte";

    function create_fragment$4(ctx) {
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
    			add_location(h1, file$2, 3, 0, 20);
    			add_location(p, file$2, 4, 0, 35);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotFound",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/routes/Home.svelte generated by Svelte v3.38.2 */

    function create_fragment$3(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
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
    	validate_slots("Home", slots, []);
    	location.href = "#/list";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const getTotalByStatus = async (status) => {
        const host = `${apiHost}/get_total_by_status?status=` + status;
        console.log(host);
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

    const getListByStatus = async (status, start, end) => {
        const host = `${apiHost}/get_list_by_status?status=${status}&start=${start}&end=${end}`;
        console.log(host);
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

    /* src/routes/List.svelte generated by Svelte v3.38.2 */
    const file$1 = "src/routes/List.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
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

    // (37:4) {:then result}
    function create_then_block(ctx) {
    	let div;
    	let h6;
    	let t0;
    	let t1_value = /*result*/ ctx[11].data.total + "";
    	let t1;
    	let t2;
    	let t3;
    	let each_1_anchor;
    	let each_value = /*result*/ ctx[11].data.list;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h6 = element("h6");
    			t0 = text("총 ");
    			t1 = text(t1_value);
    			t2 = text("건");
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(h6, "class", "m-0");
    			add_location(h6, file$1, 38, 8, 1167);
    			attr_dev(div, "class", "col-12 d-flex justify-content-end mb-2");
    			add_location(div, file$1, 37, 6, 1106);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h6);
    			append_dev(h6, t0);
    			append_dev(h6, t1);
    			append_dev(h6, t2);
    			insert_dev(target, t3, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*getList*/ 2 && t1_value !== (t1_value = /*result*/ ctx[11].data.total + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*push, getList, statusColor, statusString, getRepresentImage*/ 54) {
    				each_value = /*result*/ ctx[11].data.list;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
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
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t3);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(37:4) {:then result}",
    		ctx
    	});

    	return block;
    }

    // (41:6) {#each result.data.list as data}
    function create_each_block(ctx) {
    	let div15;
    	let div14;
    	let div13;
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div12;
    	let div11;
    	let div7;
    	let div6;
    	let div4;
    	let h5;
    	let i;
    	let t1_value = /*data*/ ctx[12].user + "";
    	let t1;
    	let t2;
    	let div5;
    	let span0;
    	let t3_value = /*statusString*/ ctx[4][/*data*/ ctx[12].request_status] + "";
    	let t3;
    	let span0_class_value;
    	let t4;
    	let div9;
    	let div8;
    	let span1;
    	let t5;
    	let t6_value = /*data*/ ctx[12].request_no + "";
    	let t6;
    	let t7;
    	let div10;
    	let p;
    	let small;
    	let t8_value = /*data*/ ctx[12].reg_date + "";
    	let t8;
    	let t9;
    	let button;
    	let t11;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*data*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			div15 = element("div");
    			div14 = element("div");
    			div13 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div12 = element("div");
    			div11 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			div4 = element("div");
    			h5 = element("h5");
    			i = element("i");
    			t1 = text(t1_value);
    			t2 = space();
    			div5 = element("div");
    			span0 = element("span");
    			t3 = text(t3_value);
    			t4 = space();
    			div9 = element("div");
    			div8 = element("div");
    			span1 = element("span");
    			t5 = text("Request No. ");
    			t6 = text(t6_value);
    			t7 = space();
    			div10 = element("div");
    			p = element("p");
    			small = element("small");
    			t8 = text(t8_value);
    			t9 = space();
    			button = element("button");
    			button.textContent = "자세히 보기";
    			t11 = space();
    			if (img.src !== (img_src_value = /*getRepresentImage*/ ctx[2](/*data*/ ctx[12].image_url))) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*data*/ ctx[12].request_no);
    			attr_dev(img, "class", "mh-100 mw-100 w-auto h-auto");
    			add_location(img, file$1, 50, 22, 1668);
    			attr_dev(div0, "class", "d-flex justify-content-center align-items-center w-100 h-100");
    			add_location(div0, file$1, 47, 20, 1528);
    			attr_dev(div1, "class", "content p-2 svelte-sqkmxg");
    			add_location(div1, file$1, 46, 18, 1482);
    			attr_dev(div2, "class", "square bg-light rounded-5 svelte-sqkmxg");
    			add_location(div2, file$1, 45, 16, 1424);
    			attr_dev(div3, "class", "col-4 col-md-5");
    			add_location(div3, file$1, 44, 14, 1379);
    			attr_dev(i, "class", "fas fa-user-circle m-1");
    			add_location(i, file$1, 65, 26, 2261);
    			attr_dev(h5, "class", "card-title mb-0");
    			add_location(h5, file$1, 64, 24, 2206);
    			attr_dev(div4, "class", "");
    			add_location(div4, file$1, 63, 22, 2167);
    			attr_dev(span0, "class", span0_class_value = "badge " + /*statusColor*/ ctx[5][/*data*/ ctx[12].request_status] + " svelte-sqkmxg");
    			add_location(span0, file$1, 69, 24, 2429);
    			attr_dev(div5, "class", "");
    			add_location(div5, file$1, 68, 22, 2390);
    			attr_dev(div6, "class", "d-flex m-0 p-0 justify-content-between");
    			add_location(div6, file$1, 62, 20, 2092);
    			attr_dev(div7, "class", "row");
    			add_location(div7, file$1, 61, 18, 2054);
    			attr_dev(span1, "class", "badge bg-light text-dark m-0");
    			add_location(span1, file$1, 77, 22, 2761);
    			attr_dev(div8, "class", "col mb-3");
    			add_location(div8, file$1, 76, 20, 2716);
    			attr_dev(div9, "class", "row");
    			add_location(div9, file$1, 75, 18, 2678);
    			add_location(small, file$1, 84, 22, 3079);
    			attr_dev(p, "class", "card-text text-end my-auto");
    			add_location(p, file$1, 83, 20, 3018);
    			attr_dev(div10, "class", "row mt-3 mt-md-5 mb-md-3");
    			add_location(div10, file$1, 82, 18, 2959);
    			attr_dev(button, "class", "btn btn-primary w-100");
    			add_location(button, file$1, 87, 18, 3178);
    			attr_dev(div11, "class", "card-body");
    			add_location(div11, file$1, 60, 16, 2012);
    			attr_dev(div12, "class", "col");
    			add_location(div12, file$1, 59, 14, 1978);
    			attr_dev(div13, "class", "row");
    			add_location(div13, file$1, 43, 12, 1347);
    			attr_dev(div14, "class", "card");
    			add_location(div14, file$1, 42, 10, 1316);
    			attr_dev(div15, "class", "col-lg-6 col-12 mb-3");
    			add_location(div15, file$1, 41, 8, 1271);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div15, anchor);
    			append_dev(div15, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div13, t0);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, h5);
    			append_dev(h5, i);
    			append_dev(h5, t1);
    			append_dev(div6, t2);
    			append_dev(div6, div5);
    			append_dev(div5, span0);
    			append_dev(span0, t3);
    			append_dev(div11, t4);
    			append_dev(div11, div9);
    			append_dev(div9, div8);
    			append_dev(div8, span1);
    			append_dev(span1, t5);
    			append_dev(span1, t6);
    			append_dev(div11, t7);
    			append_dev(div11, div10);
    			append_dev(div10, p);
    			append_dev(p, small);
    			append_dev(small, t8);
    			append_dev(div11, t9);
    			append_dev(div11, button);
    			append_dev(div15, t11);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*getList*/ 2 && img.src !== (img_src_value = /*getRepresentImage*/ ctx[2](/*data*/ ctx[12].image_url))) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*getList*/ 2 && img_alt_value !== (img_alt_value = /*data*/ ctx[12].request_no)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*getList*/ 2 && t1_value !== (t1_value = /*data*/ ctx[12].user + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*getList*/ 2 && t3_value !== (t3_value = /*statusString*/ ctx[4][/*data*/ ctx[12].request_status] + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*getList*/ 2 && span0_class_value !== (span0_class_value = "badge " + /*statusColor*/ ctx[5][/*data*/ ctx[12].request_status] + " svelte-sqkmxg")) {
    				attr_dev(span0, "class", span0_class_value);
    			}

    			if (dirty & /*getList*/ 2 && t6_value !== (t6_value = /*data*/ ctx[12].request_no + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*getList*/ 2 && t8_value !== (t8_value = /*data*/ ctx[12].reg_date + "")) set_data_dev(t8, t8_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div15);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(41:6) {#each result.data.list as data}",
    		ctx
    	});

    	return block;
    }

    // (35:20)        <p>loading</p>     {:then result}
    function create_pending_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "loading";
    			add_location(p, file$1, 35, 6, 1066);
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
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(35:20)        <p>loading</p>     {:then result}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let listheader;
    	let updating_status;
    	let t;
    	let div1;
    	let div0;
    	let promise;
    	let current;

    	function listheader_status_binding(value) {
    		/*listheader_status_binding*/ ctx[6](value);
    	}

    	let listheader_props = {};

    	if (/*status*/ ctx[0] !== void 0) {
    		listheader_props.status = /*status*/ ctx[0];
    	}

    	listheader = new ListHeader({ props: listheader_props, $$inline: true });
    	binding_callbacks.push(() => bind(listheader, "status", listheader_status_binding));
    	listheader.$on("change", /*changeStatusHandler*/ ctx[3]);

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 11
    	};

    	handle_promise(promise = /*getList*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			create_component(listheader.$$.fragment);
    			t = space();
    			div1 = element("div");
    			div0 = element("div");
    			info.block.c();
    			attr_dev(div0, "class", "row d-flex justify-content-start");
    			add_location(div0, file$1, 33, 2, 992);
    			attr_dev(div1, "class", "container p-2");
    			add_location(div1, file$1, 32, 0, 962);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(listheader, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			info.block.m(div0, info.anchor = null);
    			info.mount = () => div0;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			const listheader_changes = {};

    			if (!updating_status && dirty & /*status*/ 1) {
    				updating_status = true;
    				listheader_changes.status = /*status*/ ctx[0];
    				add_flush_callback(() => updating_status = false);
    			}

    			listheader.$set(listheader_changes);
    			info.ctx = ctx;

    			if (dirty & /*getList*/ 2 && promise !== (promise = /*getList*/ ctx[1]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(listheader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(listheader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(listheader, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			info.block.d();
    			info.token = null;
    			info = null;
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

    const contentsPerPage = 10;

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("List", slots, []);
    	let status = 0;

    	// parameter가 없을 때 신규 접수 페이지로 이동
    	//   페이징 관련
    	let currentPage = 1;

    	let start = currentPage * contentsPerPage - contentsPerPage;
    	let end = start + contentsPerPage;
    	var getList = getListByStatus(status, start, end);

    	const getRepresentImage = image_url => {
    		let images = image_url.split(",");
    		return images[0];
    	};

    	const changeStatusHandler = () => {
    		$$invalidate(1, getList = getListByStatus(status, start, end));
    	};

    	const statusString = ["신규의뢰", "견적완료", "확인완료", "답변완료"];
    	const statusColor = ["bg-warning", "bg-info", "bg-primary", "bg-success"];
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	function listheader_status_binding(value) {
    		status = value;
    		$$invalidate(0, status);
    	}

    	const click_handler = data => push(`/viewer/${data.request_no}`);

    	$$self.$capture_state = () => ({
    		push,
    		getTotalByStatus,
    		getListByStatus,
    		onMount,
    		ListHeader,
    		dataset_dev,
    		status,
    		currentPage,
    		contentsPerPage,
    		start,
    		end,
    		getList,
    		getRepresentImage,
    		changeStatusHandler,
    		statusString,
    		statusColor
    	});

    	$$self.$inject_state = $$props => {
    		if ("status" in $$props) $$invalidate(0, status = $$props.status);
    		if ("currentPage" in $$props) currentPage = $$props.currentPage;
    		if ("start" in $$props) start = $$props.start;
    		if ("end" in $$props) end = $$props.end;
    		if ("getList" in $$props) $$invalidate(1, getList = $$props.getList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		status,
    		getList,
    		getRepresentImage,
    		changeStatusHandler,
    		statusString,
    		statusColor,
    		listheader_status_binding,
    		click_handler
    	];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/routes/Test.svelte generated by Svelte v3.38.2 */

    const file = "src/routes/Test.svelte";

    function create_fragment$1(ctx) {
    	let t0;
    	let t1;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let button2;
    	let t7;
    	let button3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			t0 = text(/*status*/ ctx[0]);
    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "0";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "1";
    			t5 = space();
    			button2 = element("button");
    			button2.textContent = "2";
    			t7 = space();
    			button3 = element("button");
    			button3.textContent = "3";
    			add_location(button0, file, 9, 0, 106);
    			add_location(button1, file, 10, 0, 158);
    			add_location(button2, file, 11, 0, 201);
    			add_location(button3, file, 12, 0, 244);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, button2, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, button3, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[2], false, false, false),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*status*/ ctx[0] = 1)) (/*status*/ ctx[0] = 1).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button2,
    						"click",
    						function () {
    							if (is_function(/*status*/ ctx[0] = 2)) (/*status*/ ctx[0] = 2).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button3,
    						"click",
    						function () {
    							if (is_function(/*status*/ ctx[0] = 3)) (/*status*/ ctx[0] = 3).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (dirty & /*status*/ 1) set_data_dev(t0, /*status*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(button3);
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
    	validate_slots("Test", slots, []);
    	let { status } = $$props;

    	var changeStatus = num => {
    		$$invalidate(0, status = num);
    	};

    	const writable_props = ["status"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Test> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => changeStatus(0);

    	$$self.$$set = $$props => {
    		if ("status" in $$props) $$invalidate(0, status = $$props.status);
    	};

    	$$self.$capture_state = () => ({ status, changeStatus });

    	$$self.$inject_state = $$props => {
    		if ("status" in $$props) $$invalidate(0, status = $$props.status);
    		if ("changeStatus" in $$props) $$invalidate(1, changeStatus = $$props.changeStatus);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [status, changeStatus, click_handler];
    }

    class Test extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { status: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Test",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*status*/ ctx[0] === undefined && !("status" in props)) {
    			console.warn("<Test> was created without expected prop 'status'");
    		}
    	}

    	get status() {
    		throw new Error("<Test>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set status(value) {
    		throw new Error("<Test>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const routes = {
        '/': Home,
        '/request': RequestForm,
        '/viewer/:request_no': Viewer,
        // '/list/:status': List,
        '/list': List,
        '/test': Test,
        '*': NotFound
    };

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

    	$$self.$capture_state = () => ({ Router, routes });
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
