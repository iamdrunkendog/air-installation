
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
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
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
            'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
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
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
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

    const { Error: Error_1, Object: Object_1$1, console: console_1$3 } = globals;

    // (251:0) {:else}
    function create_else_block$4(ctx) {
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
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(251:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:0) {#if componentParams}
    function create_if_block$9(ctx) {
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
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$t(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$9, create_else_block$4];
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
    		id: create_fragment$t.name,
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

    function instance$t($$self, $$props, $$invalidate) {
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

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<Router> was created with unknown prop '${key}'`);
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

    		init(this, options, instance$t, create_fragment$t, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$t.name
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
    const file$l = "src/components/ImagePicker/ImagePicker.svelte";

    function create_fragment$s(ctx) {
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
    			add_location(img, file$l, 52, 6, 1354);
    			attr_dev(div0, "class", "d-flex justify-content-center align-items-center h-100");
    			add_location(div0, file$l, 51, 4, 1279);
    			attr_dev(button0, "class", "btn btn-lg btn-floating btn-light");
    			button0.disabled = button0_disabled_value = !/*active*/ ctx[1];
    			toggle_class(button0, "d-none", /*isUploaded*/ ctx[0] || /*isUploading*/ ctx[3]);
    			add_location(button0, file$l, 64, 8, 1694);
    			attr_dev(span, "class", "visually-hidden");
    			add_location(span, file$l, 78, 10, 2075);
    			attr_dev(div1, "class", "spinner-border");
    			attr_dev(div1, "role", "status");
    			toggle_class(div1, "d-none", !/*isUploading*/ ctx[3]);
    			toggle_class(div1, "d-block", /*isUploading*/ ctx[3]);
    			add_location(div1, file$l, 72, 8, 1917);
    			attr_dev(div2, "class", "d-flex justify-content-center align-items-center h-100");
    			add_location(div2, file$l, 63, 6, 1617);
    			attr_dev(div3, "class", "mask");
    			set_style(div3, "background-color", "rgba(255,255,255," + /*maskOpacity*/ ctx[4] + ")");
    			toggle_class(div3, "d-none", /*isUploaded*/ ctx[0]);
    			add_location(div3, file$l, 58, 4, 1486);
    			attr_dev(button1, "class", "btn btn-danger btn-small btn-floating");
    			add_location(button1, file$l, 84, 8, 2279);
    			attr_dev(div4, "class", "d-flex justify-content-end h-100 p-2");
    			add_location(div4, file$l, 83, 6, 2220);
    			attr_dev(div5, "class", "mask");
    			toggle_class(div5, "d-none", !/*isUploaded*/ ctx[0]);
    			add_location(div5, file$l, 82, 4, 2168);
    			attr_dev(div6, "class", "bg-image h-100");
    			add_location(div6, file$l, 50, 2, 1246);
    			attr_dev(div7, "class", "card border square w-100 h-100 shadow-none");
    			attr_dev(div7, "id", "pickerCard");
    			add_location(div7, file$l, 49, 0, 1171);
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
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$s, create_fragment$s, safe_not_equal, { value: 7, active: 1, isUploaded: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImagePicker",
    			options,
    			id: create_fragment$s.name
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

    var apiHost="http://aircon.shopa.deals:3000/api";

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

    const file$k = "src/components/Alert.svelte";

    // (9:0) {#if showAlert}
    function create_if_block$8(ctx) {
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
    			add_location(span, file$k, 11, 6, 259);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn-close");
    			add_location(button, file$k, 12, 6, 288);
    			attr_dev(div0, "class", "d-flex justify-content-between align-items-center");
    			add_location(div0, file$k, 10, 4, 189);
    			attr_dev(div1, "class", "alert alert-danger");
    			add_location(div1, file$k, 9, 2, 152);
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
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(9:0) {#if showAlert}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$r(ctx) {
    	let if_block_anchor;
    	let if_block = /*showAlert*/ ctx[0] && create_if_block$8(ctx);

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
    					if_block = create_if_block$8(ctx);
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
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$r($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$r, create_fragment$r, safe_not_equal, { message: 1, showAlert: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Alert",
    			options,
    			id: create_fragment$r.name
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
    const file$j = "src/components/ListHeader/ListHeader.svelte";

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
    	let if_block = /*result*/ ctx[9].data.total && create_if_block_2$2(ctx);

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
    function create_if_block_2$2(ctx) {
    	let span;
    	let t_value = /*result*/ ctx[9].data.total + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "badge bg-danger badge-notification rounded-pill text-light");
    			add_location(span, file$j, 53, 16, 1469);
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
    		id: create_if_block_2$2.name,
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
    	let if_block = /*result*/ ctx[9].data.total && create_if_block_1$3(ctx);

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
    function create_if_block_1$3(ctx) {
    	let span;
    	let t_value = /*result*/ ctx[9].data.total + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "badge bg-danger badge-notification rounded-pill text-light");
    			add_location(span, file$j, 71, 16, 2050);
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
    		id: create_if_block_1$3.name,
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
    	let if_block = /*result*/ ctx[9].data.total && create_if_block$7(ctx);

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
    function create_if_block$7(ctx) {
    	let span;
    	let t_value = /*result*/ ctx[9].data.total + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "badge bg-danger badge-notification rounded-pill text-light");
    			add_location(span, file$j, 89, 16, 2627);
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
    		id: create_if_block$7.name,
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
    function create_catch_block$4(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$4.name,
    		type: "catch",
    		source: "(1:0) <script>   import { getTotalByStatus }",
    		ctx
    	});

    	return block;
    }

    // (106:48)                <span                 class="badge  bg-light badge-notification rounded-pill  text-dark"               >                 {result.data.total}
    function create_then_block$4(ctx) {
    	let span;
    	let t_value = /*result*/ ctx[9].data.total + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "badge  bg-light badge-notification rounded-pill  text-dark");
    			add_location(span, file$j, 106, 14, 3164);
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
    		id: create_then_block$4.name,
    		type: "then",
    		source: "(106:48)                <span                 class=\\\"badge  bg-light badge-notification rounded-pill  text-dark\\\"               >                 {result.data.total}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { getTotalByStatus }
    function create_pending_block$4(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$4.name,
    		type: "pending",
    		source: "(1:0) <script>   import { getTotalByStatus }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$q(ctx) {
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
    	let span1;
    	let t5;
    	let t6;
    	let li2;
    	let a2;
    	let t7;
    	let span2;
    	let t8;
    	let t9;
    	let li3;
    	let a3;
    	let t10;
    	let span3;
    	let t11;
    	let t12;
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
    		pending: create_pending_block$4,
    		then: create_then_block$4,
    		catch: create_catch_block$4,
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
    			t4 = text("사장님 견적 완료");
    			span1 = element("span");
    			t5 = space();
    			info_1.block.c();
    			t6 = space();
    			li2 = element("li");
    			a2 = element("a");
    			t7 = text("확인 완료");
    			span2 = element("span");
    			t8 = space();
    			info_2.block.c();
    			t9 = space();
    			li3 = element("li");
    			a3 = element("a");
    			t10 = text("답변 완료");
    			span3 = element("span");
    			t11 = space();
    			info_3.block.c();
    			t12 = space();
    			div0 = element("div");
    			button1 = element("button");
    			i1 = element("i");
    			attr_dev(i0, "class", "fas fa-bars");
    			add_location(i0, file$j, 35, 6, 902);
    			attr_dev(button0, "class", "navbar-toggler");
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "data-mdb-toggle", "collapse");
    			attr_dev(button0, "data-mdb-target", "#navbarButtonsExample");
    			attr_dev(button0, "aria-controls", "navbarButtonsExample");
    			attr_dev(button0, "aria-expanded", "false");
    			attr_dev(button0, "aria-label", "Toggle navigation");
    			add_location(button0, file$j, 26, 4, 646);
    			attr_dev(span0, "class", "m-1");
    			add_location(span0, file$j, 50, 12, 1345);
    			attr_dev(a0, "class", "nav-link");
    			attr_dev(a0, "href", "javascript:void(0)");
    			toggle_class(a0, "active", /*status*/ ctx[0] == 0);
    			add_location(a0, file$j, 43, 10, 1149);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file$j, 42, 8, 1117);
    			attr_dev(span1, "class", "m-1");
    			add_location(span1, file$j, 68, 22, 1926);
    			attr_dev(a1, "class", "nav-link");
    			attr_dev(a1, "href", "javascript:void(0)");
    			toggle_class(a1, "active", /*status*/ ctx[0] == 1);
    			add_location(a1, file$j, 63, 10, 1750);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$j, 62, 8, 1718);
    			attr_dev(span2, "class", "m-1");
    			add_location(span2, file$j, 86, 18, 2503);
    			attr_dev(a2, "class", "nav-link");
    			attr_dev(a2, "href", "javascript:void(0)");
    			toggle_class(a2, "active", /*status*/ ctx[0] == 2);
    			add_location(a2, file$j, 81, 10, 2331);
    			attr_dev(li2, "class", "nav-item");
    			add_location(li2, file$j, 80, 8, 2299);
    			attr_dev(span3, "class", "m-1");
    			add_location(span3, file$j, 104, 18, 3080);
    			attr_dev(a3, "class", "nav-link");
    			attr_dev(a3, "href", "javascript:void(0)");
    			toggle_class(a3, "active", /*status*/ ctx[0] == 3);
    			add_location(a3, file$j, 99, 10, 2908);
    			attr_dev(li3, "class", "nav-item");
    			add_location(li3, file$j, 98, 8, 2876);
    			attr_dev(ul, "class", "navbar-nav me-auto");
    			add_location(ul, file$j, 41, 6, 1077);
    			attr_dev(i1, "class", "fas fa-pencil-alt");
    			add_location(i1, file$j, 121, 11, 3582);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn-light btn-rounded btn-lg");
    			add_location(button1, file$j, 117, 8, 3444);
    			attr_dev(div0, "class", "d-flex align-items-center");
    			add_location(div0, file$j, 116, 6, 3396);
    			attr_dev(div1, "class", "collapse navbar-collapse");
    			attr_dev(div1, "id", "navbarButtonsExample");
    			add_location(div1, file$j, 39, 4, 980);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file$j, 24, 2, 591);
    			attr_dev(nav, "class", "navbar navbar-expand-lg navbar-dark bg-dark");
    			add_location(nav, file$j, 22, 0, 502);
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
    			append_dev(a1, span1);
    			append_dev(a1, t5);
    			info_1.block.m(a1, info_1.anchor = null);
    			info_1.mount = () => a1;
    			info_1.anchor = null;
    			append_dev(ul, t6);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(a2, t7);
    			append_dev(a2, span2);
    			append_dev(a2, t8);
    			info_2.block.m(a2, info_2.anchor = null);
    			info_2.mount = () => a2;
    			info_2.anchor = null;
    			append_dev(ul, t9);
    			append_dev(ul, li3);
    			append_dev(li3, a3);
    			append_dev(a3, t10);
    			append_dev(a3, span3);
    			append_dev(a3, t11);
    			info_3.block.m(a3, info_3.anchor = null);
    			info_3.mount = () => a3;
    			info_3.anchor = null;
    			append_dev(div1, t12);
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
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$q($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$q, create_fragment$q, safe_not_equal, { status: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ListHeader",
    			options,
    			id: create_fragment$q.name
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

    const { console: console_1$2 } = globals;
    const file$i = "src/routes/RequestForm.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[37] = list[i].type_no;
    	child_ctx[38] = list[i].type;
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[37] = list[i].type_no;
    	child_ctx[38] = list[i].type;
    	return child_ctx;
    }

    // (329:10) {:else}
    function create_else_block$3(ctx) {
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
    		value: 43
    	};

    	handle_promise(promise = /*postResult*/ ctx[3], info);

    	const block = {
    		c: function create() {
    			div = element("div");
    			info.block.c();
    			attr_dev(div, "class", "card-body");
    			add_location(div, file$i, 329, 12, 11137);
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
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(329:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (93:10) {#if !submitted}
    function create_if_block$6(ctx) {
    	let div24;
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
    	let hr7;
    	let t47;
    	let div18;
    	let h57;
    	let t49;
    	let div17;
    	let input6;
    	let t50;
    	let label4;
    	let t52;
    	let input7;
    	let t53;
    	let label5;
    	let t55;
    	let input8;
    	let t56;
    	let label6;
    	let t58;
    	let hr8;
    	let t59;
    	let div19;
    	let h58;
    	let t61;
    	let textarea;
    	let t62;
    	let div23;
    	let div20;
    	let alert;
    	let updating_showAlert;
    	let updating_message;
    	let t63;
    	let div21;
    	let button0;
    	let t65;
    	let div22;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;

    	function imagepicker0_value_binding(value) {
    		/*imagepicker0_value_binding*/ ctx[17](value);
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
    		/*imagepicker1_value_binding*/ ctx[18](value);
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
    		/*imagepicker2_value_binding*/ ctx[19](value);
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
    		/*imagepicker3_value_binding*/ ctx[20](value);
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
    		value: 36
    	};

    	handle_promise(/*productTypes*/ ctx[10], info);

    	let info_1 = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$3,
    		then: create_then_block$3,
    		catch: create_catch_block$3,
    		value: 36
    	};

    	handle_promise(/*livingTypes*/ ctx[9], info_1);

    	function alert_showAlert_binding(value) {
    		/*alert_showAlert_binding*/ ctx[25](value);
    	}

    	function alert_message_binding(value) {
    		/*alert_message_binding*/ ctx[26](value);
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
    			div24 = element("div");
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
    			h55.textContent = "배관 종류";
    			t31 = space();
    			div13 = element("div");
    			input2 = element("input");
    			t32 = space();
    			label0 = element("label");
    			label0.textContent = "동";
    			t34 = space();
    			input3 = element("input");
    			t35 = space();
    			label1 = element("label");
    			label1.textContent = "알루미늄";
    			t37 = space();
    			hr6 = element("hr");
    			t38 = space();
    			div16 = element("div");
    			h56 = element("h5");
    			h56.textContent = "매립배관 여부";
    			t40 = space();
    			div15 = element("div");
    			input4 = element("input");
    			t41 = space();
    			label2 = element("label");
    			label2.textContent = "O";
    			t43 = space();
    			input5 = element("input");
    			t44 = space();
    			label3 = element("label");
    			label3.textContent = "X";
    			t46 = space();
    			hr7 = element("hr");
    			t47 = space();
    			div18 = element("div");
    			h57 = element("h5");
    			h57.textContent = "철거 여부";
    			t49 = space();
    			div17 = element("div");
    			input6 = element("input");
    			t50 = space();
    			label4 = element("label");
    			label4.textContent = "철거 후 보관";
    			t52 = space();
    			input7 = element("input");
    			t53 = space();
    			label5 = element("label");
    			label5.textContent = "철거 후 폐기";
    			t55 = space();
    			input8 = element("input");
    			t56 = space();
    			label6 = element("label");
    			label6.textContent = "기존제품 없음";
    			t58 = space();
    			hr8 = element("hr");
    			t59 = space();
    			div19 = element("div");
    			h58 = element("h5");
    			h58.textContent = "기타 요청사항";
    			t61 = space();
    			textarea = element("textarea");
    			t62 = space();
    			div23 = element("div");
    			div20 = element("div");
    			create_component(alert.$$.fragment);
    			t63 = space();
    			div21 = element("div");
    			button0 = element("button");
    			button0.textContent = "이전";
    			t65 = space();
    			div22 = element("div");
    			button1 = element("button");
    			button1.textContent = "접수";
    			attr_dev(h2, "class", "card-title");
    			add_location(h2, file$i, 94, 14, 2785);
    			attr_dev(p, "class", "card-text");
    			add_location(p, file$i, 95, 14, 2836);
    			add_location(hr0, file$i, 96, 14, 2892);
    			attr_dev(h50, "class", "card-title");
    			add_location(h50, file$i, 99, 16, 2983);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control form-control-lg border");
    			input0.required = true;
    			add_location(input0, file$i, 100, 16, 3038);
    			attr_dev(div0, "class", "form-outline");
    			add_location(div0, file$i, 98, 14, 2940);
    			add_location(hr1, file$i, 107, 14, 3254);
    			attr_dev(h51, "class", "card-title");
    			add_location(h51, file$i, 110, 16, 3344);
    			attr_dev(div1, "class", "col-lg-3 col-6 p-1");
    			add_location(div1, file$i, 112, 18, 3431);
    			attr_dev(div2, "class", "col-lg-3 col-6 p-1");
    			add_location(div2, file$i, 115, 18, 3573);
    			attr_dev(div3, "class", "col-lg-3 col-6 p-1");
    			add_location(div3, file$i, 119, 18, 3716);
    			attr_dev(div4, "class", "col-lg-3 col-6 p-1");
    			add_location(div4, file$i, 123, 18, 3859);
    			attr_dev(div5, "class", "row p-2");
    			add_location(div5, file$i, 111, 16, 3391);
    			attr_dev(div6, "class", "form-outline");
    			add_location(div6, file$i, 109, 14, 3301);
    			add_location(hr2, file$i, 128, 14, 4041);
    			attr_dev(h52, "class", "card-title");
    			add_location(h52, file$i, 131, 16, 4134);
    			attr_dev(div7, "class", "btn-group m-1");
    			add_location(div7, file$i, 132, 16, 4185);
    			attr_dev(div8, "class", "form-outline");
    			add_location(div8, file$i, 130, 14, 4091);
    			add_location(hr3, file$i, 151, 14, 4923);
    			attr_dev(h53, "class", "card-title");
    			add_location(h53, file$i, 154, 16, 5016);
    			attr_dev(div9, "class", "btn-group m-1");
    			add_location(div9, file$i, 155, 16, 5066);
    			attr_dev(div10, "class", "form-outline");
    			add_location(div10, file$i, 153, 14, 4973);
    			add_location(hr4, file$i, 174, 14, 5799);
    			attr_dev(h54, "class", "card-title");
    			add_location(h54, file$i, 178, 16, 5890);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "class", "form-control form-control-lg border w-25");
    			add_location(input1, file$i, 180, 18, 5995);
    			attr_dev(span, "class", "p-1");
    			add_location(span, file$i, 185, 18, 6190);
    			attr_dev(div11, "class", "d-flex align-items-center");
    			add_location(div11, file$i, 179, 16, 5937);
    			attr_dev(div12, "class", "form-outline");
    			add_location(div12, file$i, 177, 14, 5847);
    			add_location(hr5, file$i, 188, 14, 6275);
    			attr_dev(h55, "class", "card-title");
    			add_location(h55, file$i, 191, 16, 6368);
    			attr_dev(input2, "type", "radio");
    			attr_dev(input2, "class", "btn-check");
    			attr_dev(input2, "name", "pipetype");
    			attr_dev(input2, "id", "pipetype1");
    			input2.value = "true";
    			input2.required = true;
    			add_location(input2, file$i, 193, 18, 6464);
    			attr_dev(label0, "class", "btn btn-light btn-lg");
    			attr_dev(label0, "for", "pipetype1");
    			add_location(label0, file$i, 204, 18, 6815);
    			attr_dev(input3, "type", "radio");
    			attr_dev(input3, "class", "btn-check");
    			attr_dev(input3, "name", "pipetype");
    			attr_dev(input3, "id", "pipetype2");
    			input3.value = "false";
    			input3.required = true;
    			add_location(input3, file$i, 205, 18, 6895);
    			attr_dev(label1, "class", "btn btn-light btn-lg");
    			attr_dev(label1, "for", "pipetype2");
    			add_location(label1, file$i, 216, 18, 7250);
    			attr_dev(div13, "class", "btn-group m-1");
    			add_location(div13, file$i, 192, 16, 6418);
    			attr_dev(div14, "class", "form-outline");
    			add_location(div14, file$i, 190, 14, 6325);
    			add_location(hr6, file$i, 221, 14, 7413);
    			attr_dev(h56, "class", "card-title");
    			add_location(h56, file$i, 224, 16, 7508);
    			attr_dev(input4, "type", "radio");
    			attr_dev(input4, "class", "btn-check");
    			attr_dev(input4, "name", "isburiedpipe");
    			attr_dev(input4, "id", "isburiedpipe1");
    			input4.value = "true";
    			input4.required = true;
    			add_location(input4, file$i, 226, 18, 7606);
    			attr_dev(label2, "class", "btn btn-light btn-lg");
    			attr_dev(label2, "for", "isburiedpipe1");
    			add_location(label2, file$i, 235, 18, 7915);
    			attr_dev(input5, "type", "radio");
    			attr_dev(input5, "class", "btn-check");
    			attr_dev(input5, "name", "isburiedpipe");
    			attr_dev(input5, "id", "isburiedpipe2");
    			input5.value = "false";
    			input5.required = true;
    			add_location(input5, file$i, 238, 18, 8039);
    			attr_dev(label3, "class", "btn btn-light btn-lg");
    			attr_dev(label3, "for", "isburiedpipe2");
    			add_location(label3, file$i, 247, 18, 8349);
    			attr_dev(div15, "class", "btn-group m-1");
    			add_location(div15, file$i, 225, 16, 7560);
    			attr_dev(div16, "class", "form-outline");
    			add_location(div16, file$i, 223, 14, 7465);
    			add_location(hr7, file$i, 252, 14, 8513);
    			attr_dev(h57, "class", "card-title");
    			add_location(h57, file$i, 255, 16, 8606);
    			attr_dev(input6, "type", "radio");
    			attr_dev(input6, "class", "btn-check");
    			attr_dev(input6, "name", "uninstalloption");
    			attr_dev(input6, "id", "uninstalloption1");
    			input6.value = "보관";
    			add_location(input6, file$i, 257, 18, 8702);
    			attr_dev(label4, "class", "btn btn-light btn-lg");
    			attr_dev(label4, "for", "uninstalloption1");
    			add_location(label4, file$i, 265, 18, 8989);
    			attr_dev(input7, "type", "radio");
    			attr_dev(input7, "class", "btn-check");
    			attr_dev(input7, "name", "uninstalloption");
    			attr_dev(input7, "id", "uninstalloption2");
    			input7.value = "폐기";
    			add_location(input7, file$i, 268, 18, 9122);
    			attr_dev(label5, "class", "btn btn-light btn-lg");
    			attr_dev(label5, "for", "uninstalloption2");
    			add_location(label5, file$i, 276, 18, 9409);
    			attr_dev(input8, "type", "radio");
    			attr_dev(input8, "class", "btn-check");
    			attr_dev(input8, "name", "uninstalloption");
    			attr_dev(input8, "id", "uninstalloption3");
    			input8.value = "없음";
    			add_location(input8, file$i, 279, 18, 9542);
    			attr_dev(label6, "class", "btn btn-light btn-lg");
    			attr_dev(label6, "for", "uninstalloption3");
    			add_location(label6, file$i, 287, 18, 9829);
    			attr_dev(div17, "class", "btn-group m-1");
    			add_location(div17, file$i, 256, 16, 8656);
    			attr_dev(div18, "class", "form-outline");
    			add_location(div18, file$i, 254, 14, 8563);
    			add_location(hr8, file$i, 292, 14, 10002);
    			attr_dev(h58, "class", "card-title");
    			add_location(h58, file$i, 295, 16, 10094);
    			attr_dev(textarea, "class", "form-control border");
    			attr_dev(textarea, "rows", "4");
    			add_location(textarea, file$i, 296, 16, 10146);
    			attr_dev(div19, "class", "form-outline");
    			add_location(div19, file$i, 294, 14, 10051);
    			attr_dev(div20, "class", "col-12");
    			add_location(div20, file$i, 305, 16, 10388);
    			attr_dev(button0, "class", "btn btn-lg btn-light w-100");
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$i, 309, 18, 10542);
    			attr_dev(div21, "class", "col-3");
    			add_location(div21, file$i, 308, 16, 10504);
    			attr_dev(button1, "class", "btn btn-lg btn-success w-100");
    			attr_dev(button1, "type", "button");
    			add_location(button1, file$i, 318, 18, 10830);
    			attr_dev(div22, "class", "col-9");
    			add_location(div22, file$i, 317, 16, 10792);
    			attr_dev(div23, "class", "row mt-5");
    			add_location(div23, file$i, 304, 14, 10349);
    			attr_dev(div24, "class", "card-body");
    			add_location(div24, file$i, 93, 12, 2747);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div24, anchor);
    			append_dev(div24, h2);
    			append_dev(div24, t1);
    			append_dev(div24, p);
    			append_dev(div24, t3);
    			append_dev(div24, hr0);
    			append_dev(div24, t4);
    			append_dev(div24, div0);
    			append_dev(div0, h50);
    			append_dev(div0, t6);
    			append_dev(div0, input0);
    			set_input_value(input0, /*user*/ ctx[4]);
    			append_dev(div24, t7);
    			append_dev(div24, hr1);
    			append_dev(div24, t8);
    			append_dev(div24, div6);
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
    			append_dev(div24, t14);
    			append_dev(div24, hr2);
    			append_dev(div24, t15);
    			append_dev(div24, div8);
    			append_dev(div8, h52);
    			append_dev(div8, t17);
    			append_dev(div8, div7);
    			info.block.m(div7, info.anchor = null);
    			info.mount = () => div7;
    			info.anchor = null;
    			append_dev(div24, t18);
    			append_dev(div24, hr3);
    			append_dev(div24, t19);
    			append_dev(div24, div10);
    			append_dev(div10, h53);
    			append_dev(div10, t21);
    			append_dev(div10, div9);
    			info_1.block.m(div9, info_1.anchor = null);
    			info_1.mount = () => div9;
    			info_1.anchor = null;
    			append_dev(div24, t22);
    			append_dev(div24, hr4);
    			append_dev(div24, t23);
    			append_dev(div24, div12);
    			append_dev(div12, h54);
    			append_dev(div12, t25);
    			append_dev(div12, div11);
    			append_dev(div11, input1);
    			set_input_value(input1, /*floor_height*/ ctx[6]);
    			append_dev(div11, t26);
    			append_dev(div11, span);
    			append_dev(div24, t28);
    			append_dev(div24, hr5);
    			append_dev(div24, t29);
    			append_dev(div24, div14);
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
    			append_dev(div24, t37);
    			append_dev(div24, hr6);
    			append_dev(div24, t38);
    			append_dev(div24, div16);
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
    			append_dev(div24, t46);
    			append_dev(div24, hr7);
    			append_dev(div24, t47);
    			append_dev(div24, div18);
    			append_dev(div18, h57);
    			append_dev(div18, t49);
    			append_dev(div18, div17);
    			append_dev(div17, input6);
    			append_dev(div17, t50);
    			append_dev(div17, label4);
    			append_dev(div17, t52);
    			append_dev(div17, input7);
    			append_dev(div17, t53);
    			append_dev(div17, label5);
    			append_dev(div17, t55);
    			append_dev(div17, input8);
    			append_dev(div17, t56);
    			append_dev(div17, label6);
    			append_dev(div24, t58);
    			append_dev(div24, hr8);
    			append_dev(div24, t59);
    			append_dev(div24, div19);
    			append_dev(div19, h58);
    			append_dev(div19, t61);
    			append_dev(div19, textarea);
    			set_input_value(textarea, /*comment*/ ctx[7]);
    			append_dev(div24, t62);
    			append_dev(div24, div23);
    			append_dev(div23, div20);
    			mount_component(alert, div20, null);
    			append_dev(div23, t63);
    			append_dev(div23, div21);
    			append_dev(div21, button0);
    			append_dev(div23, t65);
    			append_dev(div23, div22);
    			append_dev(div22, button1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[16]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[21]),
    					listen_dev(input2, "change", /*change_handler*/ ctx[22], false, false, false),
    					listen_dev(input3, "change", /*change_handler_1*/ ctx[23], false, false, false),
    					listen_dev(input4, "change", /*changeIsBuriedPipe*/ ctx[14], false, false, false),
    					listen_dev(input5, "change", /*changeIsBuriedPipe*/ ctx[14], false, false, false),
    					listen_dev(input6, "change", /*changeUninstallOption*/ ctx[15], false, false, false),
    					listen_dev(input7, "change", /*changeUninstallOption*/ ctx[15], false, false, false),
    					listen_dev(input8, "change", /*changeUninstallOption*/ ctx[15], false, false, false),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[24]),
    					listen_dev(button0, "click", /*click_handler*/ ctx[27], false, false, false),
    					listen_dev(button1, "click", /*handleSubmit*/ ctx[11], false, false, false)
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
    			if (detaching) detach_dev(div24);
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
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(93:10) {#if !submitted}",
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

    // (333:14) {:then result}
    function create_then_block_2(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*result*/ ctx[43].success) return create_if_block_1$2;
    		return create_else_block_1$2;
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
    		source: "(333:14) {:then result}",
    		ctx
    	});

    	return block;
    }

    // (347:16) {:else}
    function create_else_block_1$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "오류가 발생했습니다.";
    			add_location(p, file$i, 347, 18, 11837);
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
    		id: create_else_block_1$2.name,
    		type: "else",
    		source: "(347:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (334:16) {#if result.success}
    function create_if_block_1$2(ctx) {
    	let div0;
    	let h5;
    	let t0;
    	let br;
    	let small;
    	let t1;
    	let t2_value = /*result*/ ctx[43].data.request_no + "";
    	let t2;
    	let t3;
    	let div1;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h5 = element("h5");
    			t0 = text("접수가 완료되었습니다.");
    			br = element("br");
    			small = element("small");
    			t1 = text("접수번호 : ");
    			t2 = text(t2_value);
    			t3 = space();
    			div1 = element("div");
    			button = element("button");
    			button.textContent = "돌아가기";
    			add_location(br, file$i, 336, 34, 11404);
    			add_location(small, file$i, 336, 40, 11410);
    			add_location(h5, file$i, 335, 20, 11365);
    			attr_dev(div0, "class", "row mt-5 text-center");
    			add_location(div0, file$i, 334, 18, 11310);
    			attr_dev(button, "class", "btn btn-lg btn-light");
    			add_location(button, file$i, 342, 20, 11652);
    			attr_dev(div1, "class", "row mt-3 mb-5 d-flex justify-content-center");
    			add_location(div1, file$i, 341, 18, 11574);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h5);
    			append_dev(h5, t0);
    			append_dev(h5, br);
    			append_dev(h5, small);
    			append_dev(small, t1);
    			append_dev(small, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[28], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*postResult*/ 8 && t2_value !== (t2_value = /*result*/ ctx[43].data.request_no + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(334:16) {#if result.success}",
    		ctx
    	});

    	return block;
    }

    // (331:33)                  <p>waiting</p>               {:then result}
    function create_pending_block_2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "waiting";
    			add_location(p, file$i, 331, 16, 11211);
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
    		source: "(331:33)                  <p>waiting</p>               {:then result}",
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

    // (134:50)                      {#each types as { type_no, type }}
    function create_then_block_1(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*types*/ ctx[36];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
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
    			if (dirty[0] & /*productTypes, changeProductType*/ 5120) {
    				each_value_1 = /*types*/ ctx[36];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$2(child_ctx);
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
    		source: "(134:50)                      {#each types as { type_no, type }}",
    		ctx
    	});

    	return block;
    }

    // (135:20) {#each types as { type_no, type }}
    function create_each_block_1$2(ctx) {
    	let input;
    	let t0;
    	let label;
    	let t1_value = /*type*/ ctx[38] + "";
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
    			attr_dev(input, "id", "producttype" + /*type_no*/ ctx[37]);
    			input.value = /*type_no*/ ctx[37];
    			add_location(input, file$i, 135, 22, 4341);
    			attr_dev(label, "class", "btn btn-light btn-lg");
    			attr_dev(label, "for", "producttype" + /*type_no*/ ctx[37]);
    			add_location(label, file$i, 143, 22, 4661);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, label, anchor);
    			append_dev(label, t1);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*changeProductType*/ ctx[12], false, false, false);
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
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(135:20) {#each types as { type_no, type }}",
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
    function create_catch_block$3(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$3.name,
    		type: "catch",
    		source: "(1:0) <script>   import { pop, push }",
    		ctx
    	});

    	return block;
    }

    // (157:49)                      {#each types as { type_no, type }}
    function create_then_block$3(ctx) {
    	let each_1_anchor;
    	let each_value = /*types*/ ctx[36];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
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
    			if (dirty[0] & /*livingTypes, changeLivingType*/ 8704) {
    				each_value = /*types*/ ctx[36];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
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
    		id: create_then_block$3.name,
    		type: "then",
    		source: "(157:49)                      {#each types as { type_no, type }}",
    		ctx
    	});

    	return block;
    }

    // (158:20) {#each types as { type_no, type }}
    function create_each_block$6(ctx) {
    	let input;
    	let t0;
    	let label;
    	let t1_value = /*type*/ ctx[38] + "";
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
    			attr_dev(input, "id", "livingtype" + /*type_no*/ ctx[37]);
    			input.value = /*type_no*/ ctx[37];
    			add_location(input, file$i, 158, 22, 5221);
    			attr_dev(label, "class", "btn btn-light btn-lg");
    			attr_dev(label, "for", "livingtype" + /*type_no*/ ctx[37]);
    			add_location(label, file$i, 166, 22, 5538);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, label, anchor);
    			append_dev(label, t1);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*changeLivingType*/ ctx[13], false, false, false);
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
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(158:20) {#each types as { type_no, type }}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { pop, push }
    function create_pending_block$3(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$3.name,
    		type: "pending",
    		source: "(1:0) <script>   import { pop, push }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$p(ctx) {
    	let main;
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$6, create_else_block$3];
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
    			add_location(div0, file$i, 91, 8, 2675);
    			attr_dev(div1, "class", "col-12");
    			add_location(div1, file$i, 90, 6, 2646);
    			attr_dev(div2, "class", "row d-flex justify-content-center");
    			add_location(div2, file$i, 89, 4, 2592);
    			attr_dev(div3, "class", "container p-3");
    			add_location(div3, file$i, 88, 2, 2560);
    			attr_dev(main, "class", "svelte-1pru0wl");
    			add_location(main, file$i, 87, 0, 2551);
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
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$p($$self, $$props, $$invalidate) {
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
    		if (user == "" || user == undefined) return false; else if (image_url == "" || image_url == undefined) return false; else if (product_type == undefined) return false; else if (living_type == undefined) return false; else if (floor_height == undefined) return false; else if (is_buried_pipe == undefined) return false; else if (uninstall_option == undefined) return false; else if (pipe_type == undefined) return false; else return true;
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
    			pipe_type,
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
    	let pipe_type;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<RequestForm> was created with unknown prop '${key}'`);
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

    	const change_handler = () => {
    		$$invalidate(8, pipe_type = "동");
    	};

    	const change_handler_1 = () => {
    		$$invalidate(8, pipe_type = "알루미늄");
    	};

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
    	const click_handler_1 = () => pop();

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
    		comment,
    		pipe_type
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
    		if ("changeProductType" in $$props) $$invalidate(12, changeProductType = $$props.changeProductType);
    		if ("living_type" in $$props) living_type = $$props.living_type;
    		if ("changeLivingType" in $$props) $$invalidate(13, changeLivingType = $$props.changeLivingType);
    		if ("floor_height" in $$props) $$invalidate(6, floor_height = $$props.floor_height);
    		if ("is_buried_pipe" in $$props) is_buried_pipe = $$props.is_buried_pipe;
    		if ("changeIsBuriedPipe" in $$props) $$invalidate(14, changeIsBuriedPipe = $$props.changeIsBuriedPipe);
    		if ("uninstall_option" in $$props) uninstall_option = $$props.uninstall_option;
    		if ("changeUninstallOption" in $$props) $$invalidate(15, changeUninstallOption = $$props.changeUninstallOption);
    		if ("comment" in $$props) $$invalidate(7, comment = $$props.comment);
    		if ("pipe_type" in $$props) $$invalidate(8, pipe_type = $$props.pipe_type);
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
    		pipe_type,
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
    		change_handler,
    		change_handler_1,
    		textarea_input_handler,
    		alert_showAlert_binding,
    		alert_message_binding,
    		click_handler,
    		click_handler_1
    	];
    }

    class RequestForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RequestForm",
    			options,
    			id: create_fragment$p.name
    		});
    	}
    }

    const insertResult = async (body) => {
        const host = `${apiHost}/insert_result`;

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

    const updateResult = async (body) => {
        const host = `${apiHost}/update_result`;

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

    const setStatus = async (body) => {
        const host = `${apiHost}/set_status`;

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

    const getResult = async (requestNo) => {
        const host = `${apiHost}/get_result?request_no=${requestNo}`;
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

    const getStatus = async (requestNo) => {
        const host = `${apiHost}/get_status?request_no=${requestNo}`;
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

    const file$h = "src/components/ImageHeader/ImageHeader.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	child_ctx[4] = i;
    	return child_ctx;
    }

    // (7:2) {#each images as image, i}
    function create_each_block$5(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let a;
    	let img;
    	let img_src_value;
    	let a_href_value;
    	let t;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			a = element("a");
    			img = element("img");
    			t = space();
    			if (img.src !== (img_src_value = /*image*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "이미지" + /*i*/ ctx[4]);
    			attr_dev(img, "class", "mh-100 mw-100 w-auto h-auto p-1");
    			add_location(img, file$h, 15, 12, 396);
    			attr_dev(a, "href", a_href_value = "/#/image/" + /*requestNo*/ ctx[1] + "/" + /*i*/ ctx[4]);
    			attr_dev(a, "class", "h-100 w-100 d-flex justify-content-center align-items-center");
    			add_location(a, file$h, 11, 10, 244);
    			attr_dev(div0, "class", "content svelte-8pu3ms");
    			add_location(div0, file$h, 10, 8, 212);
    			attr_dev(div1, "class", "square border svelte-8pu3ms");
    			add_location(div1, file$h, 9, 6, 176);
    			attr_dev(div2, "class", "col-3 p-1");
    			add_location(div2, file$h, 8, 4, 146);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, a);
    			append_dev(a, img);
    			append_dev(div2, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*images*/ 1 && img.src !== (img_src_value = /*image*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*requestNo*/ 2 && a_href_value !== (a_href_value = "/#/image/" + /*requestNo*/ ctx[1] + "/" + /*i*/ ctx[4])) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(7:2) {#each images as image, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
    	let div;
    	let each_value = /*images*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "row");
    			add_location(div, file$h, 5, 0, 70);
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
    			if (dirty & /*requestNo, images*/ 3) {
    				each_value = /*images*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
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
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ImageHeader", slots, []);
    	let { images = [] } = $$props;
    	let { requestNo } = $$props;
    	const writable_props = ["images", "requestNo"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImageHeader> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("images" in $$props) $$invalidate(0, images = $$props.images);
    		if ("requestNo" in $$props) $$invalidate(1, requestNo = $$props.requestNo);
    	};

    	$$self.$capture_state = () => ({ images, requestNo });

    	$$self.$inject_state = $$props => {
    		if ("images" in $$props) $$invalidate(0, images = $$props.images);
    		if ("requestNo" in $$props) $$invalidate(1, requestNo = $$props.requestNo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [images, requestNo];
    }

    class ImageHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, { images: 0, requestNo: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageHeader",
    			options,
    			id: create_fragment$o.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*requestNo*/ ctx[1] === undefined && !("requestNo" in props)) {
    			console.warn("<ImageHeader> was created without expected prop 'requestNo'");
    		}
    	}

    	get images() {
    		throw new Error("<ImageHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set images(value) {
    		throw new Error("<ImageHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get requestNo() {
    		throw new Error("<ImageHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set requestNo(value) {
    		throw new Error("<ImageHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/Viewer.svelte generated by Svelte v3.38.2 */
    const file$g = "src/routes/Viewer.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[110] = list[i];
    	child_ctx[112] = i;
    	return child_ctx;
    }

    // (1:0) <script>   import { pop }
    function create_catch_block$2(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$2.name,
    		type: "catch",
    		source: "(1:0) <script>   import { pop }",
    		ctx
    	});

    	return block;
    }

    // (111:30)      <div class="container-fluid bg-light shadow-sm sticky-top">       <div class="container">         <div class="row">           <div class="col mt-2">             <div class="d-flex align-items-end justify-content-between">               <div class="p-1">                 <h3 class="mb-0">                   <i class="fas fa-user-circle m-1" />{result.data.user}
    function create_then_block$2(ctx) {
    	let div12;
    	let div11;
    	let div4;
    	let div3;
    	let div2;
    	let div0;
    	let h3;
    	let i;
    	let t0_value = /*result*/ ctx[109].data.user + "";
    	let t0;
    	let t1;
    	let div1;
    	let h50;
    	let span1;
    	let span0;
    	let t3_value = /*result*/ ctx[109].data.request_no + "";
    	let t3;
    	let t4;
    	let div7;
    	let div6;
    	let div5;
    	let t5;
    	let div10;
    	let div8;
    	let h51;
    	let span2;
    	let t6_value = /*result*/ ctx[109].data.product_type + "";
    	let t6;
    	let t7;
    	let h52;
    	let span3;
    	let t8_value = /*result*/ ctx[109].data.living_type + "";
    	let t8;
    	let t9;
    	let h53;
    	let span4;
    	let t10_value = /*result*/ ctx[109].data.floor_height + "";
    	let t10;
    	let t11;
    	let t12;
    	let h54;
    	let span5;
    	let t13_value = /*result*/ ctx[109].data.pipe_type + "";
    	let t13;
    	let t14;
    	let t15;
    	let t16;
    	let h55;
    	let span6;
    	let t17;
    	let t18_value = /*result*/ ctx[109].data.uninstall_option + "";
    	let t18;
    	let t19;
    	let div9;
    	let h56;
    	let span7;
    	let t20_value = /*result*/ ctx[109].data.comment + "";
    	let t20;
    	let each_value = /*result*/ ctx[109].data.image_url.split(",");
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	let if_block0 = /*result*/ ctx[109].data.is_buried_pipe && create_if_block_8(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*result*/ ctx[109].data.unsinstall_option == "없음") return create_if_block_7;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div12 = element("div");
    			div11 = element("div");
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
    			span0.textContent = "Request No.\n                    ";
    			t3 = text(t3_value);
    			t4 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			div10 = element("div");
    			div8 = element("div");
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
    			h54 = element("h5");
    			span5 = element("span");
    			t13 = text(t13_value);
    			t14 = text("배관");
    			t15 = space();
    			if (if_block0) if_block0.c();
    			t16 = space();
    			h55 = element("h5");
    			span6 = element("span");
    			if_block1.c();
    			t17 = space();
    			t18 = text(t18_value);
    			t19 = space();
    			div9 = element("div");
    			h56 = element("h5");
    			span7 = element("span");
    			t20 = text(t20_value);
    			attr_dev(i, "class", "fas fa-user-circle m-1");
    			add_location(i, file$g, 118, 18, 3199);
    			attr_dev(h3, "class", "mb-0");
    			add_location(h3, file$g, 117, 16, 3163);
    			attr_dev(div0, "class", "p-1");
    			add_location(div0, file$g, 116, 14, 3129);
    			attr_dev(span0, "class", "d-none d-md-inline-block");
    			add_location(span0, file$g, 124, 21, 3440);
    			attr_dev(span1, "class", "badge bg-light text-dark");
    			add_location(span1, file$g, 123, 18, 3380);
    			attr_dev(h50, "class", "mb-0");
    			add_location(h50, file$g, 122, 16, 3344);
    			attr_dev(div1, "class", "-1");
    			add_location(div1, file$g, 121, 14, 3311);
    			attr_dev(div2, "class", "d-flex align-items-end justify-content-between");
    			add_location(div2, file$g, 115, 12, 3054);
    			attr_dev(div3, "class", "col mt-2");
    			add_location(div3, file$g, 114, 10, 3019);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$g, 113, 8, 2991);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$g, 138, 12, 3852);
    			attr_dev(div6, "class", "col px-4 py-2");
    			add_location(div6, file$g, 134, 10, 3722);
    			attr_dev(div7, "class", "row");
    			add_location(div7, file$g, 133, 8, 3694);
    			attr_dev(span2, "class", "badge bg-dark rounded-pill");
    			add_location(span2, file$g, 164, 14, 4779);
    			attr_dev(h51, "class", "mx-1");
    			add_location(h51, file$g, 163, 12, 4747);
    			attr_dev(span3, "class", "badge bg-dark rounded-pill");
    			add_location(span3, file$g, 169, 14, 4948);
    			attr_dev(h52, "class", "mx-1");
    			add_location(h52, file$g, 168, 12, 4916);
    			attr_dev(span4, "class", "badge bg-dark rounded-pill");
    			add_location(span4, file$g, 174, 14, 5116);
    			attr_dev(h53, "class", "mx-1");
    			add_location(h53, file$g, 173, 12, 5084);
    			attr_dev(span5, "class", "badge bg-dark rounded-pill");
    			add_location(span5, file$g, 180, 14, 5287);
    			attr_dev(h54, "class", "mx-1");
    			add_location(h54, file$g, 179, 12, 5255);
    			attr_dev(span6, "class", "badge bg-dark rounded-pill");
    			add_location(span6, file$g, 190, 14, 5639);
    			attr_dev(h55, "class", "mx-1");
    			add_location(h55, file$g, 189, 12, 5607);
    			attr_dev(div8, "class", "col d-flex");
    			add_location(div8, file$g, 162, 10, 4710);
    			attr_dev(span7, "class", "badge bg-light rounded-pill text-dark");
    			add_location(span7, file$g, 202, 14, 6010);
    			attr_dev(h56, "class", "mx-1");
    			add_location(h56, file$g, 201, 12, 5978);
    			attr_dev(div9, "class", "row");
    			add_location(div9, file$g, 200, 10, 5948);
    			attr_dev(div10, "class", "row");
    			add_location(div10, file$g, 161, 8, 4682);
    			attr_dev(div11, "class", "container");
    			add_location(div11, file$g, 112, 6, 2959);
    			attr_dev(div12, "class", "container-fluid bg-light shadow-sm sticky-top");
    			add_location(div12, file$g, 111, 4, 2893);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div12, anchor);
    			append_dev(div12, div11);
    			append_dev(div11, div4);
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
    			append_dev(div11, t4);
    			append_dev(div11, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div5, null);
    			}

    			append_dev(div11, t5);
    			append_dev(div11, div10);
    			append_dev(div10, div8);
    			append_dev(div8, h51);
    			append_dev(h51, span2);
    			append_dev(span2, t6);
    			append_dev(div8, t7);
    			append_dev(div8, h52);
    			append_dev(h52, span3);
    			append_dev(span3, t8);
    			append_dev(div8, t9);
    			append_dev(div8, h53);
    			append_dev(h53, span4);
    			append_dev(span4, t10);
    			append_dev(span4, t11);
    			append_dev(div8, t12);
    			append_dev(div8, h54);
    			append_dev(h54, span5);
    			append_dev(span5, t13);
    			append_dev(span5, t14);
    			append_dev(div8, t15);
    			if (if_block0) if_block0.m(div8, null);
    			append_dev(div8, t16);
    			append_dev(div8, h55);
    			append_dev(h55, span6);
    			if_block1.m(span6, null);
    			append_dev(span6, t17);
    			append_dev(span6, t18);
    			append_dev(div10, t19);
    			append_dev(div10, div9);
    			append_dev(div9, h56);
    			append_dev(h56, span7);
    			append_dev(span7, t20);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*requestNo, getData*/ 1536) {
    				each_value = /*result*/ ctx[109].data.image_url.split(",");
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div5, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div12);
    			destroy_each(each_blocks, detaching);
    			if (if_block0) if_block0.d();
    			if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$2.name,
    		type: "then",
    		source: "(111:30)      <div class=\\\"container-fluid bg-light shadow-sm sticky-top\\\">       <div class=\\\"container\\\">         <div class=\\\"row\\\">           <div class=\\\"col mt-2\\\">             <div class=\\\"d-flex align-items-end justify-content-between\\\">               <div class=\\\"p-1\\\">                 <h3 class=\\\"mb-0\\\">                   <i class=\\\"fas fa-user-circle m-1\\\" />{result.data.user}",
    		ctx
    	});

    	return block;
    }

    // (140:14) {#each result.data.image_url.split(",") as image, i}
    function create_each_block$4(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let a;
    	let img;
    	let img_src_value;
    	let t;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			a = element("a");
    			img = element("img");
    			t = space();
    			if (img.src !== (img_src_value = /*image*/ ctx[110])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "이미지" + /*i*/ ctx[112]);
    			attr_dev(img, "class", "mh-100 mw-100 w-auto h-auto p-1");
    			add_location(img, file$g, 148, 24, 4324);
    			attr_dev(a, "href", "/#/image/" + /*requestNo*/ ctx[9] + "/" + /*i*/ ctx[112]);
    			attr_dev(a, "class", "h-100 w-100 d-flex justify-content-center align-items-center");
    			add_location(a, file$g, 144, 22, 4124);
    			attr_dev(div0, "class", "content svelte-kwefzz");
    			add_location(div0, file$g, 143, 20, 4080);
    			attr_dev(div1, "class", "square border svelte-kwefzz");
    			add_location(div1, file$g, 142, 18, 4032);
    			attr_dev(div2, "class", "col-3 p-1");
    			add_location(div2, file$g, 141, 16, 3990);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, a);
    			append_dev(a, img);
    			append_dev(div2, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(140:14) {#each result.data.image_url.split(\\\",\\\") as image, i}",
    		ctx
    	});

    	return block;
    }

    // (185:12) {#if result.data.is_buried_pipe}
    function create_if_block_8(ctx) {
    	let h5;
    	let span;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			span = element("span");
    			span.textContent = "매립배관";
    			attr_dev(span, "class", "badge bg-dark rounded-pill");
    			add_location(span, file$g, 186, 16, 5504);
    			attr_dev(h5, "class", "mx-1");
    			add_location(h5, file$g, 185, 14, 5470);
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
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(185:12) {#if result.data.is_buried_pipe}",
    		ctx
    	});

    	return block;
    }

    // (194:16) {:else}
    function create_else_block_1$1(ctx) {
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
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(194:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (192:16) {#if result.data.unsinstall_option == "없음"}
    function create_if_block_7(ctx) {
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
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(192:16) {#if result.data.unsinstall_option == \\\"없음\\\"}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { pop }
    function create_pending_block$2(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$2.name,
    		type: "pending",
    		source: "(1:0) <script>   import { pop }",
    		ctx
    	});

    	return block;
    }

    // (1192:30) 
    function create_if_block_5(ctx) {
    	let table;
    	let thead;
    	let tr0;
    	let th;
    	let h1;
    	let u;
    	let t1;
    	let tbody;
    	let tr1;
    	let td0;
    	let t3;
    	let td1;
    	let div0;
    	let input0;
    	let t4;
    	let tr2;
    	let td2;
    	let hr0;
    	let t5;
    	let tr3;
    	let td3;
    	let t7;
    	let td4;
    	let div1;
    	let input1;
    	let t8;
    	let tr4;
    	let td5;
    	let hr1;
    	let t9;
    	let tr5;
    	let td6;
    	let t10;
    	let small;
    	let t12;
    	let td7;
    	let div2;
    	let input2;
    	let t13;
    	let tr6;
    	let td8;
    	let hr2;
    	let t14;
    	let tr7;
    	let td9;
    	let t16;
    	let td10;
    	let div3;
    	let input3;
    	let t17;
    	let tr8;
    	let td11;
    	let t18;
    	let td12;
    	let div5;
    	let div4;
    	let input4;
    	let input4_disabled_value;
    	let t19;
    	let span0;
    	let t21;
    	let tr9;
    	let td13;
    	let hr3;
    	let t22;
    	let tr10;
    	let td14;
    	let t24;
    	let td15;
    	let div6;
    	let input5;
    	let t25;
    	let tr11;
    	let td16;
    	let t26;
    	let td17;
    	let div8;
    	let div7;
    	let input6;
    	let input6_disabled_value;
    	let t27;
    	let span1;
    	let t29;
    	let tr12;
    	let td18;
    	let hr4;
    	let t30;
    	let tr13;
    	let td19;
    	let t32;
    	let td20;
    	let div9;
    	let input7;
    	let t33;
    	let tr14;
    	let td21;
    	let hr5;
    	let t34;
    	let tr15;
    	let td22;
    	let t36;
    	let td23;
    	let div10;
    	let input8;
    	let t37;
    	let tr16;
    	let td24;
    	let hr6;
    	let t38;
    	let tr17;
    	let td25;
    	let t40;
    	let td26;
    	let div11;
    	let input9;
    	let t41;
    	let tr18;
    	let td27;
    	let t42;
    	let td28;
    	let div13;
    	let div12;
    	let input10;
    	let input10_disabled_value;
    	let t43;
    	let span2;
    	let t45;
    	let tr19;
    	let td29;
    	let hr7;
    	let t46;
    	let tr20;
    	let td30;
    	let t48;
    	let td31;
    	let div14;
    	let input11;
    	let t49;
    	let tr21;
    	let td32;
    	let t50;
    	let td33;
    	let div16;
    	let div15;
    	let input12;
    	let input12_disabled_value;
    	let t51;
    	let span3;
    	let t53;
    	let tr22;
    	let td34;
    	let hr8;
    	let t54;
    	let tr23;
    	let td35;
    	let t56;
    	let td36;
    	let div17;
    	let input13;
    	let t57;
    	let tr24;
    	let td37;
    	let hr9;
    	let t58;
    	let tr25;
    	let td38;
    	let t60;
    	let td39;
    	let div18;
    	let input14;
    	let t61;
    	let tr26;
    	let td40;
    	let hr10;
    	let t62;
    	let tr27;
    	let td41;
    	let t64;
    	let td42;
    	let div19;
    	let input15;
    	let t65;
    	let tr28;
    	let td43;
    	let hr11;
    	let t66;
    	let tr29;
    	let td44;
    	let t68;
    	let td45;
    	let div20;
    	let input16;
    	let t69;
    	let tr30;
    	let td46;
    	let hr12;
    	let t70;
    	let tr31;
    	let td47;
    	let t72;
    	let td48;
    	let div21;
    	let input17;
    	let t73;
    	let tr32;
    	let td49;
    	let hr13;
    	let t74;
    	let tr33;
    	let td50;
    	let t76;
    	let tr34;
    	let td51;
    	let div22;
    	let textarea;
    	let t77;
    	let t78;
    	let tr35;
    	let td52;
    	let button0;
    	let t80;
    	let tr36;
    	let td53;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*showAlert*/ ctx[2] && create_if_block_6(ctx);

    	const block = {
    		c: function create() {
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th = element("th");
    			h1 = element("h1");
    			u = element("u");
    			u.textContent = "Checklist";
    			t1 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "앵글";
    			t3 = space();
    			td1 = element("td");
    			div0 = element("div");
    			input0 = element("input");
    			t4 = space();
    			tr2 = element("tr");
    			td2 = element("td");
    			hr0 = element("hr");
    			t5 = space();
    			tr3 = element("tr");
    			td3 = element("td");
    			td3.textContent = "실외기 받침대";
    			t7 = space();
    			td4 = element("td");
    			div1 = element("div");
    			input1 = element("input");
    			t8 = space();
    			tr4 = element("tr");
    			td5 = element("td");
    			hr1 = element("hr");
    			t9 = space();
    			tr5 = element("tr");
    			td6 = element("td");
    			t10 = text("실외기 고정");
    			small = element("small");
    			small.textContent = "(컷팅반도)";
    			t12 = space();
    			td7 = element("td");
    			div2 = element("div");
    			input2 = element("input");
    			t13 = space();
    			tr6 = element("tr");
    			td8 = element("td");
    			hr2 = element("hr");
    			t14 = space();
    			tr7 = element("tr");
    			td9 = element("td");
    			td9.textContent = "배관 연장";
    			t16 = space();
    			td10 = element("td");
    			div3 = element("div");
    			input3 = element("input");
    			t17 = space();
    			tr8 = element("tr");
    			td11 = element("td");
    			t18 = space();
    			td12 = element("td");
    			div5 = element("div");
    			div4 = element("div");
    			input4 = element("input");
    			t19 = space();
    			span0 = element("span");
    			span0.textContent = "m";
    			t21 = space();
    			tr9 = element("tr");
    			td13 = element("td");
    			hr3 = element("hr");
    			t22 = space();
    			tr10 = element("tr");
    			td14 = element("td");
    			td14.textContent = "주름 배관";
    			t24 = space();
    			td15 = element("td");
    			div6 = element("div");
    			input5 = element("input");
    			t25 = space();
    			tr11 = element("tr");
    			td16 = element("td");
    			t26 = space();
    			td17 = element("td");
    			div8 = element("div");
    			div7 = element("div");
    			input6 = element("input");
    			t27 = space();
    			span1 = element("span");
    			span1.textContent = "m";
    			t29 = space();
    			tr12 = element("tr");
    			td18 = element("td");
    			hr4 = element("hr");
    			t30 = space();
    			tr13 = element("tr");
    			td19 = element("td");
    			td19.textContent = "배관 용접";
    			t32 = space();
    			td20 = element("td");
    			div9 = element("div");
    			input7 = element("input");
    			t33 = space();
    			tr14 = element("tr");
    			td21 = element("td");
    			hr5 = element("hr");
    			t34 = space();
    			tr15 = element("tr");
    			td22 = element("td");
    			td22.textContent = "냉매 주입";
    			t36 = space();
    			td23 = element("td");
    			div10 = element("div");
    			input8 = element("input");
    			t37 = space();
    			tr16 = element("tr");
    			td24 = element("td");
    			hr6 = element("hr");
    			t38 = space();
    			tr17 = element("tr");
    			td25 = element("td");
    			td25.textContent = "배수 펌프";
    			t40 = space();
    			td26 = element("td");
    			div11 = element("div");
    			input9 = element("input");
    			t41 = space();
    			tr18 = element("tr");
    			td27 = element("td");
    			t42 = space();
    			td28 = element("td");
    			div13 = element("div");
    			div12 = element("div");
    			input10 = element("input");
    			t43 = space();
    			span2 = element("span");
    			span2.textContent = "m";
    			t45 = space();
    			tr19 = element("tr");
    			td29 = element("td");
    			hr7 = element("hr");
    			t46 = space();
    			tr20 = element("tr");
    			td30 = element("td");
    			td30.textContent = "추가 타공";
    			t48 = space();
    			td31 = element("td");
    			div14 = element("div");
    			input11 = element("input");
    			t49 = space();
    			tr21 = element("tr");
    			td32 = element("td");
    			t50 = space();
    			td33 = element("td");
    			div16 = element("div");
    			div15 = element("div");
    			input12 = element("input");
    			t51 = space();
    			span3 = element("span");
    			span3.textContent = "회";
    			t53 = space();
    			tr22 = element("tr");
    			td34 = element("td");
    			hr8 = element("hr");
    			t54 = space();
    			tr23 = element("tr");
    			td35 = element("td");
    			td35.textContent = "실외기 위험수당";
    			t56 = space();
    			td36 = element("td");
    			div17 = element("div");
    			input13 = element("input");
    			t57 = space();
    			tr24 = element("tr");
    			td37 = element("td");
    			hr9 = element("hr");
    			t58 = space();
    			tr25 = element("tr");
    			td38 = element("td");
    			td38.textContent = "실외기 배수 Kit";
    			t60 = space();
    			td39 = element("td");
    			div18 = element("div");
    			input14 = element("input");
    			t61 = space();
    			tr26 = element("tr");
    			td40 = element("td");
    			hr10 = element("hr");
    			t62 = space();
    			tr27 = element("tr");
    			td41 = element("td");
    			td41.textContent = "유니온";
    			t64 = space();
    			td42 = element("td");
    			div19 = element("div");
    			input15 = element("input");
    			t65 = space();
    			tr28 = element("tr");
    			td43 = element("td");
    			hr11 = element("hr");
    			t66 = space();
    			tr29 = element("tr");
    			td44 = element("td");
    			td44.textContent = "전원선";
    			t68 = space();
    			td45 = element("td");
    			div20 = element("div");
    			input16 = element("input");
    			t69 = space();
    			tr30 = element("tr");
    			td46 = element("td");
    			hr12 = element("hr");
    			t70 = space();
    			tr31 = element("tr");
    			td47 = element("td");
    			td47.textContent = "실외기 에어가이드";
    			t72 = space();
    			td48 = element("td");
    			div21 = element("div");
    			input17 = element("input");
    			t73 = space();
    			tr32 = element("tr");
    			td49 = element("td");
    			hr13 = element("hr");
    			t74 = space();
    			tr33 = element("tr");
    			td50 = element("td");
    			td50.textContent = "사장님 의견";
    			t76 = space();
    			tr34 = element("tr");
    			td51 = element("td");
    			div22 = element("div");
    			textarea = element("textarea");
    			t77 = space();
    			if (if_block) if_block.c();
    			t78 = space();
    			tr35 = element("tr");
    			td52 = element("td");
    			button0 = element("button");
    			button0.textContent = "견적 완료";
    			t80 = space();
    			tr36 = element("tr");
    			td53 = element("td");
    			button1 = element("button");
    			button1.textContent = "뒤로가기";
    			add_location(u, file$g, 1196, 35, 38896);
    			attr_dev(h1, "class", "my-4");
    			add_location(h1, file$g, 1196, 18, 38879);
    			attr_dev(th, "colspan", "2");
    			add_location(th, file$g, 1195, 16, 38844);
    			add_location(tr0, file$g, 1194, 14, 38823);
    			add_location(thead, file$g, 1193, 12, 38801);
    			add_location(td0, file$g, 1202, 16, 39036);
    			attr_dev(input0, "class", "form-check-input");
    			attr_dev(input0, "type", "checkbox");
    			input0.__value = "";
    			input0.value = input0.__value;
    			add_location(input0, file$g, 1205, 20, 39168);
    			attr_dev(div0, "class", "form-check d-flex justify-content-end");
    			add_location(div0, file$g, 1204, 18, 39096);
    			attr_dev(td1, "class", "");
    			add_location(td1, file$g, 1203, 16, 39064);
    			add_location(tr1, file$g, 1201, 14, 39015);
    			add_location(hr0, file$g, 1215, 32, 39484);
    			attr_dev(td2, "colspan", "2");
    			add_location(td2, file$g, 1215, 16, 39468);
    			add_location(tr2, file$g, 1214, 14, 39447);
    			add_location(td3, file$g, 1219, 16, 39552);
    			attr_dev(input1, "class", "form-check-input");
    			attr_dev(input1, "type", "checkbox");
    			input1.__value = "";
    			input1.value = input1.__value;
    			add_location(input1, file$g, 1222, 20, 39680);
    			attr_dev(div1, "class", "form-check d-flex justify-content-end");
    			add_location(div1, file$g, 1221, 18, 39608);
    			add_location(td4, file$g, 1220, 16, 39585);
    			add_location(tr3, file$g, 1218, 14, 39531);
    			add_location(hr1, file$g, 1233, 32, 39997);
    			attr_dev(td5, "colspan", "2");
    			add_location(td5, file$g, 1233, 16, 39981);
    			add_location(tr4, file$g, 1232, 14, 39960);
    			add_location(small, file$g, 1236, 26, 40074);
    			add_location(td6, file$g, 1236, 16, 40064);
    			attr_dev(input2, "class", "form-check-input");
    			attr_dev(input2, "type", "checkbox");
    			input2.__value = "";
    			input2.value = input2.__value;
    			add_location(input2, file$g, 1239, 20, 40212);
    			attr_dev(div2, "class", "form-check d-flex justify-content-end");
    			add_location(div2, file$g, 1238, 18, 40140);
    			add_location(td7, file$g, 1237, 16, 40117);
    			add_location(tr5, file$g, 1235, 14, 40043);
    			add_location(hr2, file$g, 1250, 32, 40530);
    			attr_dev(td8, "colspan", "2");
    			add_location(td8, file$g, 1250, 16, 40514);
    			add_location(tr6, file$g, 1249, 14, 40493);
    			add_location(td9, file$g, 1253, 16, 40597);
    			attr_dev(input3, "class", "form-check-input");
    			attr_dev(input3, "type", "checkbox");
    			input3.__value = "";
    			input3.value = input3.__value;
    			add_location(input3, file$g, 1256, 20, 40723);
    			attr_dev(div3, "class", "form-check d-flex justify-content-end");
    			add_location(div3, file$g, 1255, 18, 40651);
    			add_location(td10, file$g, 1254, 16, 40628);
    			add_location(tr7, file$g, 1252, 14, 40576);
    			add_location(td11, file$g, 1266, 16, 41029);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "class", "form-control svelte-kwefzz");
    			attr_dev(input4, "placeholder", "연장 길이");
    			attr_dev(input4, "aria-label", "연장 길이");
    			input4.disabled = input4_disabled_value = !/*formData*/ ctx[4].pipe_extend;
    			attr_dev(input4, "aria-describedby", "pipelength");
    			add_location(input4, file$g, 1270, 22, 41202);
    			attr_dev(span0, "class", "input-group-text");
    			attr_dev(span0, "id", "pipelength");
    			add_location(span0, file$g, 1279, 22, 41602);
    			attr_dev(div4, "class", "input-group input-group-sm");
    			add_location(div4, file$g, 1269, 20, 41139);
    			attr_dev(div5, "class", "d-flex justify-content-center");
    			add_location(div5, file$g, 1268, 18, 41075);
    			add_location(td12, file$g, 1267, 16, 41052);
    			add_location(tr8, file$g, 1265, 14, 41008);
    			add_location(hr3, file$g, 1285, 32, 41805);
    			attr_dev(td13, "colspan", "2");
    			add_location(td13, file$g, 1285, 16, 41789);
    			add_location(tr9, file$g, 1284, 14, 41768);
    			add_location(td14, file$g, 1288, 16, 41872);
    			attr_dev(input5, "class", "form-check-input");
    			attr_dev(input5, "type", "checkbox");
    			input5.__value = "";
    			input5.value = input5.__value;
    			add_location(input5, file$g, 1291, 20, 41998);
    			attr_dev(div6, "class", "form-check d-flex justify-content-end");
    			add_location(div6, file$g, 1290, 18, 41926);
    			add_location(td15, file$g, 1289, 16, 41903);
    			add_location(tr10, file$g, 1287, 14, 41851);
    			add_location(td16, file$g, 1301, 16, 42300);
    			attr_dev(input6, "type", "number");
    			attr_dev(input6, "class", "form-control svelte-kwefzz");
    			attr_dev(input6, "placeholder", "필요 길이");
    			attr_dev(input6, "aria-label", "필요 길이");
    			input6.disabled = input6_disabled_value = !/*formData*/ ctx[4].wrinkle;
    			attr_dev(input6, "aria-describedby", "pipelength");
    			add_location(input6, file$g, 1305, 22, 42473);
    			attr_dev(span1, "class", "input-group-text");
    			attr_dev(span1, "id", "pipelength");
    			add_location(span1, file$g, 1314, 22, 42865);
    			attr_dev(div7, "class", "input-group input-group-sm");
    			add_location(div7, file$g, 1304, 20, 42410);
    			attr_dev(div8, "class", "d-flex justify-content-center");
    			add_location(div8, file$g, 1303, 18, 42346);
    			add_location(td17, file$g, 1302, 16, 42323);
    			add_location(tr11, file$g, 1300, 14, 42279);
    			add_location(hr4, file$g, 1320, 32, 43068);
    			attr_dev(td18, "colspan", "2");
    			add_location(td18, file$g, 1320, 16, 43052);
    			add_location(tr12, file$g, 1319, 14, 43031);
    			add_location(td19, file$g, 1323, 16, 43135);
    			attr_dev(input7, "class", "form-check-input");
    			attr_dev(input7, "type", "checkbox");
    			input7.__value = "";
    			input7.value = input7.__value;
    			add_location(input7, file$g, 1326, 20, 43261);
    			attr_dev(div9, "class", "form-check d-flex justify-content-end");
    			add_location(div9, file$g, 1325, 18, 43189);
    			add_location(td20, file$g, 1324, 16, 43166);
    			add_location(tr13, file$g, 1322, 14, 43114);
    			add_location(hr5, file$g, 1336, 32, 43579);
    			attr_dev(td21, "colspan", "2");
    			add_location(td21, file$g, 1336, 16, 43563);
    			add_location(tr14, file$g, 1335, 14, 43542);
    			add_location(td22, file$g, 1339, 16, 43646);
    			attr_dev(input8, "class", "form-check-input");
    			attr_dev(input8, "type", "checkbox");
    			input8.__value = "";
    			input8.value = input8.__value;
    			add_location(input8, file$g, 1342, 20, 43772);
    			attr_dev(div10, "class", "form-check d-flex justify-content-end");
    			add_location(div10, file$g, 1341, 18, 43700);
    			add_location(td23, file$g, 1340, 16, 43677);
    			add_location(tr15, file$g, 1338, 14, 43625);
    			add_location(hr6, file$g, 1352, 32, 44086);
    			attr_dev(td24, "colspan", "2");
    			add_location(td24, file$g, 1352, 16, 44070);
    			add_location(tr16, file$g, 1351, 14, 44049);
    			add_location(td25, file$g, 1355, 16, 44153);
    			attr_dev(input9, "class", "form-check-input");
    			attr_dev(input9, "type", "checkbox");
    			input9.__value = "";
    			input9.value = input9.__value;
    			add_location(input9, file$g, 1358, 20, 44279);
    			attr_dev(div11, "class", "form-check d-flex justify-content-end");
    			add_location(div11, file$g, 1357, 18, 44207);
    			add_location(td26, file$g, 1356, 16, 44184);
    			add_location(tr17, file$g, 1354, 14, 44132);
    			add_location(td27, file$g, 1368, 16, 44584);
    			attr_dev(input10, "type", "number");
    			attr_dev(input10, "class", "form-control svelte-kwefzz");
    			attr_dev(input10, "placeholder", "배관 길이");
    			attr_dev(input10, "aria-label", "배관 길이");
    			input10.disabled = input10_disabled_value = !/*formData*/ ctx[4].drain_pump;
    			attr_dev(input10, "aria-describedby", "pipelength");
    			add_location(input10, file$g, 1372, 22, 44757);
    			attr_dev(span2, "class", "input-group-text");
    			attr_dev(span2, "id", "pipelength");
    			add_location(span2, file$g, 1381, 22, 45155);
    			attr_dev(div12, "class", "input-group input-group-sm");
    			add_location(div12, file$g, 1371, 20, 44694);
    			attr_dev(div13, "class", "d-flex justify-content-center");
    			add_location(div13, file$g, 1370, 18, 44630);
    			add_location(td28, file$g, 1369, 16, 44607);
    			add_location(tr18, file$g, 1367, 14, 44563);
    			add_location(hr7, file$g, 1388, 32, 45359);
    			attr_dev(td29, "colspan", "2");
    			add_location(td29, file$g, 1388, 16, 45343);
    			add_location(tr19, file$g, 1387, 14, 45322);
    			add_location(td30, file$g, 1391, 16, 45426);
    			attr_dev(input11, "class", "form-check-input");
    			attr_dev(input11, "type", "checkbox");
    			input11.__value = "";
    			input11.value = input11.__value;
    			add_location(input11, file$g, 1394, 20, 45552);
    			attr_dev(div14, "class", "form-check d-flex justify-content-end");
    			add_location(div14, file$g, 1393, 18, 45480);
    			add_location(td31, file$g, 1392, 16, 45457);
    			add_location(tr20, file$g, 1390, 14, 45405);
    			add_location(td32, file$g, 1404, 16, 45851);
    			attr_dev(input12, "type", "number");
    			attr_dev(input12, "class", "form-control svelte-kwefzz");
    			attr_dev(input12, "placeholder", "타공 횟수");
    			attr_dev(input12, "aria-label", "타공 횟수");
    			input12.disabled = input12_disabled_value = !/*formData*/ ctx[4].hole;
    			attr_dev(input12, "aria-describedby", "pipelength");
    			add_location(input12, file$g, 1408, 22, 46024);
    			attr_dev(span3, "class", "input-group-text");
    			attr_dev(span3, "id", "pipelength");
    			add_location(span3, file$g, 1417, 22, 46410);
    			attr_dev(div15, "class", "input-group input-group-sm");
    			add_location(div15, file$g, 1407, 20, 45961);
    			attr_dev(div16, "class", "d-flex justify-content-center");
    			add_location(div16, file$g, 1406, 18, 45897);
    			add_location(td33, file$g, 1405, 16, 45874);
    			add_location(tr21, file$g, 1403, 14, 45830);
    			add_location(hr8, file$g, 1423, 32, 46613);
    			attr_dev(td34, "colspan", "2");
    			add_location(td34, file$g, 1423, 16, 46597);
    			add_location(tr22, file$g, 1422, 14, 46576);
    			add_location(td35, file$g, 1426, 16, 46680);
    			attr_dev(input13, "class", "form-check-input");
    			attr_dev(input13, "type", "checkbox");
    			input13.__value = "";
    			input13.value = input13.__value;
    			add_location(input13, file$g, 1429, 20, 46809);
    			attr_dev(div17, "class", "form-check d-flex justify-content-end");
    			add_location(div17, file$g, 1428, 18, 46737);
    			add_location(td36, file$g, 1427, 16, 46714);
    			add_location(tr23, file$g, 1425, 14, 46659);
    			add_location(hr9, file$g, 1439, 32, 47130);
    			attr_dev(td37, "colspan", "2");
    			add_location(td37, file$g, 1439, 16, 47114);
    			add_location(tr24, file$g, 1438, 14, 47093);
    			add_location(td38, file$g, 1442, 16, 47197);
    			attr_dev(input14, "class", "form-check-input");
    			attr_dev(input14, "type", "checkbox");
    			input14.__value = "";
    			input14.value = input14.__value;
    			add_location(input14, file$g, 1445, 20, 47328);
    			attr_dev(div18, "class", "form-check d-flex justify-content-end");
    			add_location(div18, file$g, 1444, 18, 47256);
    			add_location(td39, file$g, 1443, 16, 47233);
    			add_location(tr25, file$g, 1441, 14, 47176);
    			add_location(hr10, file$g, 1455, 32, 47648);
    			attr_dev(td40, "colspan", "2");
    			add_location(td40, file$g, 1455, 16, 47632);
    			add_location(tr26, file$g, 1454, 14, 47611);
    			add_location(td41, file$g, 1458, 16, 47715);
    			attr_dev(input15, "class", "form-check-input");
    			attr_dev(input15, "type", "checkbox");
    			input15.__value = "";
    			input15.value = input15.__value;
    			add_location(input15, file$g, 1461, 20, 47839);
    			attr_dev(div19, "class", "form-check d-flex justify-content-end");
    			add_location(div19, file$g, 1460, 18, 47767);
    			add_location(td42, file$g, 1459, 16, 47744);
    			add_location(tr27, file$g, 1457, 14, 47694);
    			add_location(hr11, file$g, 1471, 32, 48159);
    			attr_dev(td43, "colspan", "2");
    			add_location(td43, file$g, 1471, 16, 48143);
    			add_location(tr28, file$g, 1470, 14, 48122);
    			add_location(td44, file$g, 1474, 16, 48226);
    			attr_dev(input16, "class", "form-check-input");
    			attr_dev(input16, "type", "checkbox");
    			input16.__value = "";
    			input16.value = input16.__value;
    			add_location(input16, file$g, 1477, 20, 48350);
    			attr_dev(div20, "class", "form-check d-flex justify-content-end");
    			add_location(div20, file$g, 1476, 18, 48278);
    			add_location(td45, file$g, 1475, 16, 48255);
    			add_location(tr29, file$g, 1473, 14, 48205);
    			add_location(hr12, file$g, 1487, 32, 48671);
    			attr_dev(td46, "colspan", "2");
    			add_location(td46, file$g, 1487, 16, 48655);
    			add_location(tr30, file$g, 1486, 14, 48634);
    			add_location(td47, file$g, 1490, 16, 48738);
    			attr_dev(input17, "class", "form-check-input");
    			attr_dev(input17, "type", "checkbox");
    			input17.__value = "";
    			input17.value = input17.__value;
    			add_location(input17, file$g, 1493, 20, 48868);
    			attr_dev(div21, "class", "form-check d-flex justify-content-end");
    			add_location(div21, file$g, 1492, 18, 48796);
    			add_location(td48, file$g, 1491, 16, 48773);
    			add_location(tr31, file$g, 1489, 14, 48717);
    			add_location(hr13, file$g, 1503, 32, 49188);
    			attr_dev(td49, "colspan", "2");
    			add_location(td49, file$g, 1503, 16, 49172);
    			add_location(tr32, file$g, 1502, 14, 49151);
    			attr_dev(td50, "colspan", "2");
    			add_location(td50, file$g, 1506, 16, 49255);
    			add_location(tr33, file$g, 1505, 14, 49234);
    			attr_dev(textarea, "class", "form-control border");
    			attr_dev(textarea, "rows", "4");
    			add_location(textarea, file$g, 1511, 20, 49420);
    			attr_dev(div22, "class", "form-outline");
    			add_location(div22, file$g, 1510, 18, 49373);
    			attr_dev(td51, "colspan", "2");
    			add_location(td51, file$g, 1509, 16, 49338);
    			add_location(tr34, file$g, 1508, 14, 49317);
    			attr_dev(button0, "class", "btn btn-success btn-lg w-100 mt-5 mb-0");
    			add_location(button0, file$g, 1528, 18, 49933);
    			attr_dev(td52, "colspan", "2");
    			add_location(td52, file$g, 1527, 16, 49898);
    			add_location(tr35, file$g, 1526, 14, 49877);
    			attr_dev(button1, "class", "btn btn-light w-100 m-0");
    			add_location(button1, file$g, 1536, 18, 50198);
    			attr_dev(td53, "colspan", "2");
    			add_location(td53, file$g, 1535, 16, 50163);
    			add_location(tr36, file$g, 1534, 14, 50142);
    			add_location(tbody, file$g, 1200, 12, 38993);
    			attr_dev(table, "class", "table table-borderless table-sm");
    			add_location(table, file$g, 1192, 10, 38741);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th);
    			append_dev(th, h1);
    			append_dev(h1, u);
    			append_dev(table, t1);
    			append_dev(table, tbody);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t3);
    			append_dev(tr1, td1);
    			append_dev(td1, div0);
    			append_dev(div0, input0);
    			input0.checked = /*formData*/ ctx[4].angle;
    			append_dev(tbody, t4);
    			append_dev(tbody, tr2);
    			append_dev(tr2, td2);
    			append_dev(td2, hr0);
    			append_dev(tbody, t5);
    			append_dev(tbody, tr3);
    			append_dev(tr3, td3);
    			append_dev(tr3, t7);
    			append_dev(tr3, td4);
    			append_dev(td4, div1);
    			append_dev(div1, input1);
    			input1.checked = /*formData*/ ctx[4].stand;
    			append_dev(tbody, t8);
    			append_dev(tbody, tr4);
    			append_dev(tr4, td5);
    			append_dev(td5, hr1);
    			append_dev(tbody, t9);
    			append_dev(tbody, tr5);
    			append_dev(tr5, td6);
    			append_dev(td6, t10);
    			append_dev(td6, small);
    			append_dev(tr5, t12);
    			append_dev(tr5, td7);
    			append_dev(td7, div2);
    			append_dev(div2, input2);
    			input2.checked = /*formData*/ ctx[4].holder;
    			append_dev(tbody, t13);
    			append_dev(tbody, tr6);
    			append_dev(tr6, td8);
    			append_dev(td8, hr2);
    			append_dev(tbody, t14);
    			append_dev(tbody, tr7);
    			append_dev(tr7, td9);
    			append_dev(tr7, t16);
    			append_dev(tr7, td10);
    			append_dev(td10, div3);
    			append_dev(div3, input3);
    			input3.checked = /*formData*/ ctx[4].pipe_extend;
    			append_dev(tbody, t17);
    			append_dev(tbody, tr8);
    			append_dev(tr8, td11);
    			append_dev(tr8, t18);
    			append_dev(tr8, td12);
    			append_dev(td12, div5);
    			append_dev(div5, div4);
    			append_dev(div4, input4);
    			set_input_value(input4, /*formData*/ ctx[4].pipe_extend_length);
    			append_dev(div4, t19);
    			append_dev(div4, span0);
    			append_dev(tbody, t21);
    			append_dev(tbody, tr9);
    			append_dev(tr9, td13);
    			append_dev(td13, hr3);
    			append_dev(tbody, t22);
    			append_dev(tbody, tr10);
    			append_dev(tr10, td14);
    			append_dev(tr10, t24);
    			append_dev(tr10, td15);
    			append_dev(td15, div6);
    			append_dev(div6, input5);
    			input5.checked = /*formData*/ ctx[4].wrinkle;
    			append_dev(tbody, t25);
    			append_dev(tbody, tr11);
    			append_dev(tr11, td16);
    			append_dev(tr11, t26);
    			append_dev(tr11, td17);
    			append_dev(td17, div8);
    			append_dev(div8, div7);
    			append_dev(div7, input6);
    			set_input_value(input6, /*formData*/ ctx[4].wrinkle_length);
    			append_dev(div7, t27);
    			append_dev(div7, span1);
    			append_dev(tbody, t29);
    			append_dev(tbody, tr12);
    			append_dev(tr12, td18);
    			append_dev(td18, hr4);
    			append_dev(tbody, t30);
    			append_dev(tbody, tr13);
    			append_dev(tr13, td19);
    			append_dev(tr13, t32);
    			append_dev(tr13, td20);
    			append_dev(td20, div9);
    			append_dev(div9, input7);
    			input7.checked = /*formData*/ ctx[4].welding;
    			append_dev(tbody, t33);
    			append_dev(tbody, tr14);
    			append_dev(tr14, td21);
    			append_dev(td21, hr5);
    			append_dev(tbody, t34);
    			append_dev(tbody, tr15);
    			append_dev(tr15, td22);
    			append_dev(tr15, t36);
    			append_dev(tr15, td23);
    			append_dev(td23, div10);
    			append_dev(div10, input8);
    			input8.checked = /*formData*/ ctx[4].gas;
    			append_dev(tbody, t37);
    			append_dev(tbody, tr16);
    			append_dev(tr16, td24);
    			append_dev(td24, hr6);
    			append_dev(tbody, t38);
    			append_dev(tbody, tr17);
    			append_dev(tr17, td25);
    			append_dev(tr17, t40);
    			append_dev(tr17, td26);
    			append_dev(td26, div11);
    			append_dev(div11, input9);
    			input9.checked = /*formData*/ ctx[4].drain_pump;
    			append_dev(tbody, t41);
    			append_dev(tbody, tr18);
    			append_dev(tr18, td27);
    			append_dev(tr18, t42);
    			append_dev(tr18, td28);
    			append_dev(td28, div13);
    			append_dev(div13, div12);
    			append_dev(div12, input10);
    			set_input_value(input10, /*formData*/ ctx[4].drain_pump_length);
    			append_dev(div12, t43);
    			append_dev(div12, span2);
    			append_dev(tbody, t45);
    			append_dev(tbody, tr19);
    			append_dev(tr19, td29);
    			append_dev(td29, hr7);
    			append_dev(tbody, t46);
    			append_dev(tbody, tr20);
    			append_dev(tr20, td30);
    			append_dev(tr20, t48);
    			append_dev(tr20, td31);
    			append_dev(td31, div14);
    			append_dev(div14, input11);
    			input11.checked = /*formData*/ ctx[4].hole;
    			append_dev(tbody, t49);
    			append_dev(tbody, tr21);
    			append_dev(tr21, td32);
    			append_dev(tr21, t50);
    			append_dev(tr21, td33);
    			append_dev(td33, div16);
    			append_dev(div16, div15);
    			append_dev(div15, input12);
    			set_input_value(input12, /*formData*/ ctx[4].hole_amount);
    			append_dev(div15, t51);
    			append_dev(div15, span3);
    			append_dev(tbody, t53);
    			append_dev(tbody, tr22);
    			append_dev(tr22, td34);
    			append_dev(td34, hr8);
    			append_dev(tbody, t54);
    			append_dev(tbody, tr23);
    			append_dev(tr23, td35);
    			append_dev(tr23, t56);
    			append_dev(tr23, td36);
    			append_dev(td36, div17);
    			append_dev(div17, input13);
    			input13.checked = /*formData*/ ctx[4].danger_fee;
    			append_dev(tbody, t57);
    			append_dev(tbody, tr24);
    			append_dev(tr24, td37);
    			append_dev(td37, hr9);
    			append_dev(tbody, t58);
    			append_dev(tbody, tr25);
    			append_dev(tr25, td38);
    			append_dev(tr25, t60);
    			append_dev(tr25, td39);
    			append_dev(td39, div18);
    			append_dev(div18, input14);
    			input14.checked = /*formData*/ ctx[4].drain_kit;
    			append_dev(tbody, t61);
    			append_dev(tbody, tr26);
    			append_dev(tr26, td40);
    			append_dev(td40, hr10);
    			append_dev(tbody, t62);
    			append_dev(tbody, tr27);
    			append_dev(tr27, td41);
    			append_dev(tr27, t64);
    			append_dev(tr27, td42);
    			append_dev(td42, div19);
    			append_dev(div19, input15);
    			input15.checked = /*formData*/ ctx[4].union_kit;
    			append_dev(tbody, t65);
    			append_dev(tbody, tr28);
    			append_dev(tr28, td43);
    			append_dev(td43, hr11);
    			append_dev(tbody, t66);
    			append_dev(tbody, tr29);
    			append_dev(tr29, td44);
    			append_dev(tr29, t68);
    			append_dev(tr29, td45);
    			append_dev(td45, div20);
    			append_dev(div20, input16);
    			input16.checked = /*formData*/ ctx[4].power_line;
    			append_dev(tbody, t69);
    			append_dev(tbody, tr30);
    			append_dev(tr30, td46);
    			append_dev(td46, hr12);
    			append_dev(tbody, t70);
    			append_dev(tbody, tr31);
    			append_dev(tr31, td47);
    			append_dev(tr31, t72);
    			append_dev(tr31, td48);
    			append_dev(td48, div21);
    			append_dev(div21, input17);
    			input17.checked = /*formData*/ ctx[4].air_guide;
    			append_dev(tbody, t73);
    			append_dev(tbody, tr32);
    			append_dev(tr32, td49);
    			append_dev(td49, hr13);
    			append_dev(tbody, t74);
    			append_dev(tbody, tr33);
    			append_dev(tr33, td50);
    			append_dev(tbody, t76);
    			append_dev(tbody, tr34);
    			append_dev(tr34, td51);
    			append_dev(td51, div22);
    			append_dev(div22, textarea);
    			set_input_value(textarea, /*formData*/ ctx[4].comment);
    			append_dev(tbody, t77);
    			if (if_block) if_block.m(tbody, null);
    			append_dev(tbody, t78);
    			append_dev(tbody, tr35);
    			append_dev(tr35, td52);
    			append_dev(td52, button0);
    			append_dev(tbody, t80);
    			append_dev(tbody, tr36);
    			append_dev(tr36, td53);
    			append_dev(td53, button1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_handler_3*/ ctx[83]),
    					listen_dev(input1, "change", /*input1_change_handler_3*/ ctx[84]),
    					listen_dev(input2, "change", /*input2_change_handler_3*/ ctx[85]),
    					listen_dev(input3, "change", /*input3_change_handler_3*/ ctx[86]),
    					listen_dev(input4, "input", /*input4_input_handler_3*/ ctx[87]),
    					listen_dev(input5, "change", /*input5_change_handler_3*/ ctx[88]),
    					listen_dev(input6, "input", /*input6_input_handler_3*/ ctx[89]),
    					listen_dev(input7, "change", /*input7_change_handler_3*/ ctx[90]),
    					listen_dev(input8, "change", /*input8_change_handler_3*/ ctx[91]),
    					listen_dev(input9, "change", /*input9_change_handler_3*/ ctx[92]),
    					listen_dev(input10, "input", /*input10_input_handler_3*/ ctx[93]),
    					listen_dev(input11, "change", /*input11_change_handler_3*/ ctx[94]),
    					listen_dev(input12, "input", /*input12_input_handler_3*/ ctx[95]),
    					listen_dev(input13, "change", /*input13_change_handler_3*/ ctx[96]),
    					listen_dev(input14, "change", /*input14_change_handler_3*/ ctx[97]),
    					listen_dev(input15, "change", /*input15_change_handler_3*/ ctx[98]),
    					listen_dev(input16, "change", /*input16_change_handler_3*/ ctx[99]),
    					listen_dev(input17, "change", /*input17_change_handler_3*/ ctx[100]),
    					listen_dev(textarea, "input", /*textarea_input_handler_1*/ ctx[101]),
    					listen_dev(button0, "click", /*handleSubmit*/ ctx[12], false, false, false),
    					listen_dev(button1, "click", /*click_handler_5*/ ctx[104], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*formData*/ 16) {
    				input0.checked = /*formData*/ ctx[4].angle;
    			}

    			if (dirty[0] & /*formData*/ 16) {
    				input1.checked = /*formData*/ ctx[4].stand;
    			}

    			if (dirty[0] & /*formData*/ 16) {
    				input2.checked = /*formData*/ ctx[4].holder;
    			}

    			if (dirty[0] & /*formData*/ 16) {
    				input3.checked = /*formData*/ ctx[4].pipe_extend;
    			}

    			if (!current || dirty[0] & /*formData*/ 16 && input4_disabled_value !== (input4_disabled_value = !/*formData*/ ctx[4].pipe_extend)) {
    				prop_dev(input4, "disabled", input4_disabled_value);
    			}

    			if (dirty[0] & /*formData*/ 16 && to_number(input4.value) !== /*formData*/ ctx[4].pipe_extend_length) {
    				set_input_value(input4, /*formData*/ ctx[4].pipe_extend_length);
    			}

    			if (dirty[0] & /*formData*/ 16) {
    				input5.checked = /*formData*/ ctx[4].wrinkle;
    			}

    			if (!current || dirty[0] & /*formData*/ 16 && input6_disabled_value !== (input6_disabled_value = !/*formData*/ ctx[4].wrinkle)) {
    				prop_dev(input6, "disabled", input6_disabled_value);
    			}

    			if (dirty[0] & /*formData*/ 16 && to_number(input6.value) !== /*formData*/ ctx[4].wrinkle_length) {
    				set_input_value(input6, /*formData*/ ctx[4].wrinkle_length);
    			}

    			if (dirty[0] & /*formData*/ 16) {
    				input7.checked = /*formData*/ ctx[4].welding;
    			}

    			if (dirty[0] & /*formData*/ 16) {
    				input8.checked = /*formData*/ ctx[4].gas;
    			}

    			if (dirty[0] & /*formData*/ 16) {
    				input9.checked = /*formData*/ ctx[4].drain_pump;
    			}

    			if (!current || dirty[0] & /*formData*/ 16 && input10_disabled_value !== (input10_disabled_value = !/*formData*/ ctx[4].drain_pump)) {
    				prop_dev(input10, "disabled", input10_disabled_value);
    			}

    			if (dirty[0] & /*formData*/ 16 && to_number(input10.value) !== /*formData*/ ctx[4].drain_pump_length) {
    				set_input_value(input10, /*formData*/ ctx[4].drain_pump_length);
    			}

    			if (dirty[0] & /*formData*/ 16) {
    				input11.checked = /*formData*/ ctx[4].hole;
    			}

    			if (!current || dirty[0] & /*formData*/ 16 && input12_disabled_value !== (input12_disabled_value = !/*formData*/ ctx[4].hole)) {
    				prop_dev(input12, "disabled", input12_disabled_value);
    			}

    			if (dirty[0] & /*formData*/ 16 && to_number(input12.value) !== /*formData*/ ctx[4].hole_amount) {
    				set_input_value(input12, /*formData*/ ctx[4].hole_amount);
    			}

    			if (dirty[0] & /*formData*/ 16) {
    				input13.checked = /*formData*/ ctx[4].danger_fee;
    			}

    			if (dirty[0] & /*formData*/ 16) {
    				input14.checked = /*formData*/ ctx[4].drain_kit;
    			}

    			if (dirty[0] & /*formData*/ 16) {
    				input15.checked = /*formData*/ ctx[4].union_kit;
    			}

    			if (dirty[0] & /*formData*/ 16) {
    				input16.checked = /*formData*/ ctx[4].power_line;
    			}

    			if (dirty[0] & /*formData*/ 16) {
    				input17.checked = /*formData*/ ctx[4].air_guide;
    			}

    			if (dirty[0] & /*formData*/ 16) {
    				set_input_value(textarea, /*formData*/ ctx[4].comment);
    			}

    			if (/*showAlert*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*showAlert*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_6(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(tbody, t78);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
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
    			if (detaching) detach_dev(table);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(1192:30) ",
    		ctx
    	});

    	return block;
    }

    // (859:30) 
    function create_if_block_3$1(ctx) {
    	let div0;
    	let button0;
    	let i;
    	let t0;
    	let t1;
    	let table;
    	let thead;
    	let tr0;
    	let th0;
    	let t3;
    	let th1;
    	let t5;
    	let th2;
    	let t7;
    	let tbody;
    	let tr1;
    	let td0;
    	let t9;
    	let td1;
    	let div1;
    	let input0;
    	let input0_disabled_value;
    	let t10;
    	let td2;
    	let t11;
    	let tr2;
    	let td3;
    	let t13;
    	let td4;
    	let div2;
    	let input1;
    	let input1_disabled_value;
    	let t14;
    	let td5;
    	let t15;
    	let tr3;
    	let td6;
    	let t17;
    	let td7;
    	let div3;
    	let input2;
    	let input2_disabled_value;
    	let t18;
    	let td8;
    	let t19;
    	let tr4;
    	let td9;
    	let t21;
    	let td10;
    	let div4;
    	let input3;
    	let input3_disabled_value;
    	let t22;
    	let td11;
    	let div5;
    	let input4;
    	let input4_disabled_value;
    	let t23;
    	let span0;
    	let t25;
    	let tr5;
    	let td12;
    	let t27;
    	let td13;
    	let div6;
    	let input5;
    	let input5_disabled_value;
    	let t28;
    	let td14;
    	let div7;
    	let input6;
    	let input6_disabled_value;
    	let t29;
    	let span1;
    	let t31;
    	let tr6;
    	let td15;
    	let t33;
    	let td16;
    	let div8;
    	let input7;
    	let input7_disabled_value;
    	let t34;
    	let td17;
    	let t35;
    	let tr7;
    	let td18;
    	let t37;
    	let td19;
    	let div9;
    	let input8;
    	let input8_disabled_value;
    	let t38;
    	let td20;
    	let t39;
    	let tr8;
    	let td21;
    	let t41;
    	let td22;
    	let div10;
    	let input9;
    	let input9_disabled_value;
    	let t42;
    	let td23;
    	let div11;
    	let input10;
    	let input10_disabled_value;
    	let t43;
    	let span2;
    	let t45;
    	let tr9;
    	let td24;
    	let t47;
    	let td25;
    	let div12;
    	let input11;
    	let input11_disabled_value;
    	let t48;
    	let td26;
    	let div13;
    	let input12;
    	let input12_disabled_value;
    	let t49;
    	let span3;
    	let t51;
    	let tr10;
    	let td27;
    	let t53;
    	let td28;
    	let div14;
    	let input13;
    	let input13_disabled_value;
    	let t54;
    	let td29;
    	let t55;
    	let tr11;
    	let td30;
    	let t57;
    	let td31;
    	let div15;
    	let input14;
    	let input14_disabled_value;
    	let t58;
    	let td32;
    	let t59;
    	let tr12;
    	let td33;
    	let t61;
    	let td34;
    	let div16;
    	let input15;
    	let input15_disabled_value;
    	let t62;
    	let td35;
    	let t63;
    	let tr13;
    	let td36;
    	let t65;
    	let td37;
    	let div17;
    	let input16;
    	let input16_disabled_value;
    	let t66;
    	let td38;
    	let t67;
    	let tr14;
    	let td39;
    	let t69;
    	let td40;
    	let div18;
    	let input17;
    	let input17_disabled_value;
    	let t70;
    	let td41;
    	let t71;
    	let tr15;
    	let td42;
    	let div19;
    	let t73;
    	let div20;
    	let textarea;
    	let textarea_disabled_value;
    	let t74;
    	let alert;
    	let updating_showAlert;
    	let updating_message;
    	let t75;
    	let div26;
    	let div22;
    	let div21;
    	let span4;
    	let t77;
    	let input18;
    	let t78;
    	let div24;
    	let div23;
    	let span5;
    	let t80;
    	let input19;
    	let t81;
    	let div25;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type_2(ctx, dirty) {
    		if (/*modify*/ ctx[5]) return create_if_block_4;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	function alert_showAlert_binding(value) {
    		/*alert_showAlert_binding*/ ctx[79](value);
    	}

    	function alert_message_binding(value) {
    		/*alert_message_binding*/ ctx[80](value);
    	}

    	let alert_props = {};

    	if (/*showAlert*/ ctx[2] !== void 0) {
    		alert_props.showAlert = /*showAlert*/ ctx[2];
    	}

    	if (/*message*/ ctx[3] !== void 0) {
    		alert_props.message = /*message*/ ctx[3];
    	}

    	alert = new Alert({ props: alert_props, $$inline: true });
    	binding_callbacks.push(() => bind(alert, "showAlert", alert_showAlert_binding));
    	binding_callbacks.push(() => bind(alert, "message", alert_message_binding));

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			button0 = element("button");
    			i = element("i");
    			t0 = text(" 수정 ");
    			if_block.c();
    			t1 = space();
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "구분";
    			t3 = space();
    			th1 = element("th");
    			th1.textContent = "결과";
    			t5 = space();
    			th2 = element("th");
    			th2.textContent = "비고";
    			t7 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "앵글";
    			t9 = space();
    			td1 = element("td");
    			div1 = element("div");
    			input0 = element("input");
    			t10 = space();
    			td2 = element("td");
    			t11 = space();
    			tr2 = element("tr");
    			td3 = element("td");
    			td3.textContent = "실외기스탠드";
    			t13 = space();
    			td4 = element("td");
    			div2 = element("div");
    			input1 = element("input");
    			t14 = space();
    			td5 = element("td");
    			t15 = space();
    			tr3 = element("tr");
    			td6 = element("td");
    			td6.textContent = "실외기고정(컷팅반도)";
    			t17 = space();
    			td7 = element("td");
    			div3 = element("div");
    			input2 = element("input");
    			t18 = space();
    			td8 = element("td");
    			t19 = space();
    			tr4 = element("tr");
    			td9 = element("td");
    			td9.textContent = "배관 연장";
    			t21 = space();
    			td10 = element("td");
    			div4 = element("div");
    			input3 = element("input");
    			t22 = space();
    			td11 = element("td");
    			div5 = element("div");
    			input4 = element("input");
    			t23 = space();
    			span0 = element("span");
    			span0.textContent = "m";
    			t25 = space();
    			tr5 = element("tr");
    			td12 = element("td");
    			td12.textContent = "주름 배관";
    			t27 = space();
    			td13 = element("td");
    			div6 = element("div");
    			input5 = element("input");
    			t28 = space();
    			td14 = element("td");
    			div7 = element("div");
    			input6 = element("input");
    			t29 = space();
    			span1 = element("span");
    			span1.textContent = "m";
    			t31 = space();
    			tr6 = element("tr");
    			td15 = element("td");
    			td15.textContent = "배관 용접";
    			t33 = space();
    			td16 = element("td");
    			div8 = element("div");
    			input7 = element("input");
    			t34 = space();
    			td17 = element("td");
    			t35 = space();
    			tr7 = element("tr");
    			td18 = element("td");
    			td18.textContent = "냉매 보충";
    			t37 = space();
    			td19 = element("td");
    			div9 = element("div");
    			input8 = element("input");
    			t38 = space();
    			td20 = element("td");
    			t39 = space();
    			tr8 = element("tr");
    			td21 = element("td");
    			td21.textContent = "드레인 펌프";
    			t41 = space();
    			td22 = element("td");
    			div10 = element("div");
    			input9 = element("input");
    			t42 = space();
    			td23 = element("td");
    			div11 = element("div");
    			input10 = element("input");
    			t43 = space();
    			span2 = element("span");
    			span2.textContent = "m";
    			t45 = space();
    			tr9 = element("tr");
    			td24 = element("td");
    			td24.textContent = "추가 타공";
    			t47 = space();
    			td25 = element("td");
    			div12 = element("div");
    			input11 = element("input");
    			t48 = space();
    			td26 = element("td");
    			div13 = element("div");
    			input12 = element("input");
    			t49 = space();
    			span3 = element("span");
    			span3.textContent = "m";
    			t51 = space();
    			tr10 = element("tr");
    			td27 = element("td");
    			td27.textContent = "실외기 설치 위험수당";
    			t53 = space();
    			td28 = element("td");
    			div14 = element("div");
    			input13 = element("input");
    			t54 = space();
    			td29 = element("td");
    			t55 = space();
    			tr11 = element("tr");
    			td30 = element("td");
    			td30.textContent = "드레인 키트";
    			t57 = space();
    			td31 = element("td");
    			div15 = element("div");
    			input14 = element("input");
    			t58 = space();
    			td32 = element("td");
    			t59 = space();
    			tr12 = element("tr");
    			td33 = element("td");
    			td33.textContent = "유니온";
    			t61 = space();
    			td34 = element("td");
    			div16 = element("div");
    			input15 = element("input");
    			t62 = space();
    			td35 = element("td");
    			t63 = space();
    			tr13 = element("tr");
    			td36 = element("td");
    			td36.textContent = "전원선 연장";
    			t65 = space();
    			td37 = element("td");
    			div17 = element("div");
    			input16 = element("input");
    			t66 = space();
    			td38 = element("td");
    			t67 = space();
    			tr14 = element("tr");
    			td39 = element("td");
    			td39.textContent = "에어 가이드";
    			t69 = space();
    			td40 = element("td");
    			div18 = element("div");
    			input17 = element("input");
    			t70 = space();
    			td41 = element("td");
    			t71 = space();
    			tr15 = element("tr");
    			td42 = element("td");
    			div19 = element("div");
    			div19.textContent = "사장님 의견";
    			t73 = space();
    			div20 = element("div");
    			textarea = element("textarea");
    			t74 = space();
    			create_component(alert.$$.fragment);
    			t75 = space();
    			div26 = element("div");
    			div22 = element("div");
    			div21 = element("div");
    			span4 = element("span");
    			span4.textContent = "최소";
    			t77 = space();
    			input18 = element("input");
    			t78 = space();
    			div24 = element("div");
    			div23 = element("div");
    			span5 = element("span");
    			span5.textContent = "최대";
    			t80 = space();
    			input19 = element("input");
    			t81 = space();
    			div25 = element("div");
    			button1 = element("button");
    			button1.textContent = "제출";
    			attr_dev(i, "class", "fas fa-pencil-alt");
    			add_location(i, file$g, 867, 15, 27973);
    			attr_dev(button0, "class", "m-2 btn btn-rounded");
    			toggle_class(button0, "btn-warning", /*modify*/ ctx[5]);
    			toggle_class(button0, "btn-light", !/*modify*/ ctx[5]);
    			add_location(button0, file$g, 860, 12, 27744);
    			attr_dev(div0, "class", "d-flex justify-content-start");
    			add_location(div0, file$g, 859, 10, 27689);
    			add_location(th0, file$g, 873, 16, 28173);
    			add_location(th1, file$g, 874, 16, 28201);
    			attr_dev(th2, "class", "w-25");
    			add_location(th2, file$g, 875, 16, 28229);
    			add_location(tr0, file$g, 872, 14, 28152);
    			add_location(thead, file$g, 871, 12, 28130);
    			add_location(td0, file$g, 880, 16, 28350);
    			attr_dev(input0, "class", "form-check-input");
    			attr_dev(input0, "type", "checkbox");
    			input0.disabled = input0_disabled_value = !/*modify*/ ctx[5];
    			add_location(input0, file$g, 883, 20, 28475);
    			attr_dev(div1, "class", "form-check d-flex justify-content-start");
    			add_location(div1, file$g, 882, 18, 28401);
    			add_location(td1, file$g, 881, 16, 28378);
    			add_location(td2, file$g, 891, 16, 28748);
    			add_location(tr1, file$g, 879, 14, 28329);
    			add_location(td3, file$g, 895, 16, 28811);
    			attr_dev(input1, "class", "form-check-input");
    			attr_dev(input1, "type", "checkbox");
    			input1.disabled = input1_disabled_value = !/*modify*/ ctx[5];
    			add_location(input1, file$g, 898, 20, 28940);
    			attr_dev(div2, "class", "form-check d-flex justify-content-start");
    			add_location(div2, file$g, 897, 19, 28866);
    			add_location(td4, file$g, 896, 16, 28843);
    			add_location(td5, file$g, 906, 16, 29213);
    			add_location(tr2, file$g, 894, 14, 28790);
    			add_location(td6, file$g, 910, 16, 29276);
    			attr_dev(input2, "class", "form-check-input");
    			attr_dev(input2, "type", "checkbox");
    			input2.disabled = input2_disabled_value = !/*modify*/ ctx[5];
    			add_location(input2, file$g, 913, 20, 29410);
    			attr_dev(div3, "class", "form-check d-flex justify-content-start");
    			add_location(div3, file$g, 912, 18, 29336);
    			add_location(td7, file$g, 911, 16, 29313);
    			add_location(td8, file$g, 921, 16, 29684);
    			add_location(tr3, file$g, 909, 14, 29255);
    			add_location(td9, file$g, 925, 16, 29747);
    			attr_dev(input3, "class", "form-check-input");
    			attr_dev(input3, "type", "checkbox");
    			input3.disabled = input3_disabled_value = !/*modify*/ ctx[5];
    			add_location(input3, file$g, 928, 20, 29875);
    			attr_dev(div4, "class", "form-check d-flex justify-content-start");
    			add_location(div4, file$g, 927, 19, 29801);
    			add_location(td10, file$g, 926, 16, 29778);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "class", "form-control w-50 svelte-kwefzz");
    			attr_dev(input4, "placeholder", "필요 길이");
    			attr_dev(input4, "aria-label", "필요 길이");
    			input4.disabled = input4_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].pipe_extend);
    			add_location(input4, file$g, 938, 20, 30238);
    			attr_dev(span0, "class", "input-group-text");
    			add_location(span0, file$g, 946, 20, 30589);
    			attr_dev(div5, "class", "input-group input-group-sm");
    			add_location(div5, file$g, 937, 18, 30177);
    			add_location(td11, file$g, 936, 16, 30154);
    			add_location(tr4, file$g, 924, 14, 29726);
    			add_location(td12, file$g, 952, 16, 30734);
    			attr_dev(input5, "class", "form-check-input");
    			attr_dev(input5, "type", "checkbox");
    			input5.disabled = input5_disabled_value = !/*modify*/ ctx[5];
    			add_location(input5, file$g, 955, 20, 30862);
    			attr_dev(div6, "class", "form-check d-flex justify-content-start");
    			add_location(div6, file$g, 954, 19, 30788);
    			add_location(td13, file$g, 953, 16, 30765);
    			attr_dev(input6, "type", "number");
    			attr_dev(input6, "class", "form-control w-50 svelte-kwefzz");
    			attr_dev(input6, "placeholder", "필요 길이");
    			attr_dev(input6, "aria-label", "필요 길이");
    			input6.disabled = input6_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].wrinkle);
    			add_location(input6, file$g, 965, 20, 31221);
    			attr_dev(span1, "class", "input-group-text");
    			add_location(span1, file$g, 973, 20, 31564);
    			attr_dev(div7, "class", "input-group input-group-sm");
    			add_location(div7, file$g, 964, 18, 31160);
    			add_location(td14, file$g, 963, 16, 31137);
    			add_location(tr5, file$g, 951, 14, 30713);
    			add_location(td15, file$g, 979, 16, 31709);
    			attr_dev(input7, "class", "form-check-input");
    			attr_dev(input7, "type", "checkbox");
    			input7.disabled = input7_disabled_value = !/*modify*/ ctx[5];
    			add_location(input7, file$g, 982, 20, 31837);
    			attr_dev(div8, "class", "form-check d-flex justify-content-start");
    			add_location(div8, file$g, 981, 18, 31763);
    			add_location(td16, file$g, 980, 16, 31740);
    			add_location(td17, file$g, 990, 16, 32112);
    			add_location(tr6, file$g, 978, 14, 31688);
    			add_location(td18, file$g, 994, 16, 32175);
    			attr_dev(input8, "class", "form-check-input");
    			attr_dev(input8, "type", "checkbox");
    			input8.disabled = input8_disabled_value = !/*modify*/ ctx[5];
    			add_location(input8, file$g, 997, 20, 32303);
    			attr_dev(div9, "class", "form-check d-flex justify-content-start");
    			add_location(div9, file$g, 996, 18, 32229);
    			add_location(td19, file$g, 995, 16, 32206);
    			add_location(td20, file$g, 1005, 16, 32574);
    			add_location(tr7, file$g, 993, 14, 32154);
    			add_location(td21, file$g, 1009, 16, 32637);
    			attr_dev(input9, "class", "form-check-input");
    			attr_dev(input9, "type", "checkbox");
    			input9.disabled = input9_disabled_value = !/*modify*/ ctx[5];
    			add_location(input9, file$g, 1012, 20, 32766);
    			attr_dev(div10, "class", "form-check d-flex justify-content-start");
    			add_location(div10, file$g, 1011, 19, 32692);
    			add_location(td22, file$g, 1010, 16, 32669);
    			attr_dev(input10, "type", "number");
    			attr_dev(input10, "class", "form-control w-50 svelte-kwefzz");
    			attr_dev(input10, "placeholder", "필요 길이");
    			attr_dev(input10, "aria-label", "필요 길이");
    			input10.disabled = input10_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].drain_pump);
    			add_location(input10, file$g, 1022, 20, 33128);
    			attr_dev(span2, "class", "input-group-text");
    			add_location(span2, file$g, 1030, 20, 33477);
    			attr_dev(div11, "class", "input-group input-group-sm");
    			add_location(div11, file$g, 1021, 18, 33067);
    			add_location(td23, file$g, 1020, 16, 33044);
    			add_location(tr8, file$g, 1008, 14, 32616);
    			add_location(td24, file$g, 1036, 16, 33622);
    			attr_dev(input11, "class", "form-check-input");
    			attr_dev(input11, "type", "checkbox");
    			input11.disabled = input11_disabled_value = !/*modify*/ ctx[5];
    			add_location(input11, file$g, 1039, 20, 33750);
    			attr_dev(div12, "class", "form-check d-flex justify-content-start");
    			add_location(div12, file$g, 1038, 19, 33676);
    			add_location(td25, file$g, 1037, 16, 33653);
    			attr_dev(input12, "type", "number");
    			attr_dev(input12, "class", "form-control w-50 svelte-kwefzz");
    			attr_dev(input12, "placeholder", "타공 횟수");
    			attr_dev(input12, "aria-label", "타공 횟수");
    			input12.disabled = input12_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].hole);
    			add_location(input12, file$g, 1049, 20, 34106);
    			attr_dev(span3, "class", "input-group-text");
    			add_location(span3, file$g, 1057, 20, 34443);
    			attr_dev(div13, "class", "input-group input-group-sm");
    			add_location(div13, file$g, 1048, 18, 34045);
    			add_location(td26, file$g, 1047, 16, 34022);
    			add_location(tr9, file$g, 1035, 14, 33601);
    			add_location(td27, file$g, 1063, 16, 34588);
    			attr_dev(input13, "class", "form-check-input");
    			attr_dev(input13, "type", "checkbox");
    			input13.disabled = input13_disabled_value = !/*modify*/ ctx[5];
    			add_location(input13, file$g, 1066, 20, 34722);
    			attr_dev(div14, "class", "form-check d-flex justify-content-start");
    			add_location(div14, file$g, 1065, 18, 34648);
    			add_location(td28, file$g, 1064, 16, 34625);
    			add_location(td29, file$g, 1074, 16, 35000);
    			add_location(tr10, file$g, 1062, 14, 34567);
    			add_location(td30, file$g, 1078, 16, 35063);
    			attr_dev(input14, "class", "form-check-input");
    			attr_dev(input14, "type", "checkbox");
    			input14.disabled = input14_disabled_value = !/*modify*/ ctx[5];
    			add_location(input14, file$g, 1081, 20, 35192);
    			attr_dev(div15, "class", "form-check d-flex justify-content-start");
    			add_location(div15, file$g, 1080, 18, 35118);
    			add_location(td31, file$g, 1079, 16, 35095);
    			add_location(td32, file$g, 1089, 16, 35469);
    			add_location(tr11, file$g, 1077, 14, 35042);
    			add_location(td33, file$g, 1093, 16, 35532);
    			attr_dev(input15, "class", "form-check-input");
    			attr_dev(input15, "type", "checkbox");
    			input15.disabled = input15_disabled_value = !/*modify*/ ctx[5];
    			add_location(input15, file$g, 1096, 20, 35658);
    			attr_dev(div16, "class", "form-check d-flex justify-content-start");
    			add_location(div16, file$g, 1095, 18, 35584);
    			add_location(td34, file$g, 1094, 16, 35561);
    			add_location(td35, file$g, 1104, 16, 35935);
    			add_location(tr12, file$g, 1092, 14, 35511);
    			add_location(td36, file$g, 1108, 16, 35998);
    			attr_dev(input16, "class", "form-check-input");
    			attr_dev(input16, "type", "checkbox");
    			input16.disabled = input16_disabled_value = !/*modify*/ ctx[5];
    			add_location(input16, file$g, 1111, 20, 36127);
    			attr_dev(div17, "class", "form-check d-flex justify-content-start");
    			add_location(div17, file$g, 1110, 18, 36053);
    			add_location(td37, file$g, 1109, 16, 36030);
    			add_location(td38, file$g, 1119, 16, 36405);
    			add_location(tr13, file$g, 1107, 14, 35977);
    			add_location(td39, file$g, 1123, 16, 36468);
    			attr_dev(input17, "class", "form-check-input");
    			attr_dev(input17, "type", "checkbox");
    			input17.disabled = input17_disabled_value = !/*modify*/ ctx[5];
    			add_location(input17, file$g, 1126, 20, 36597);
    			attr_dev(div18, "class", "form-check d-flex justify-content-start");
    			add_location(div18, file$g, 1125, 18, 36523);
    			add_location(td40, file$g, 1124, 16, 36500);
    			add_location(td41, file$g, 1134, 16, 36874);
    			add_location(tr14, file$g, 1122, 14, 36447);
    			add_location(div19, file$g, 1139, 19, 36972);
    			attr_dev(textarea, "class", "form-control border");
    			textarea.disabled = textarea_disabled_value = !/*modify*/ ctx[5];
    			attr_dev(textarea, "rows", "4");
    			add_location(textarea, file$g, 1141, 20, 37055);
    			attr_dev(div20, "class", "form-outline");
    			add_location(div20, file$g, 1140, 18, 37008);
    			attr_dev(td42, "colspan", "3");
    			add_location(td42, file$g, 1138, 16, 36937);
    			add_location(tr15, file$g, 1137, 14, 36916);
    			add_location(tbody, file$g, 878, 12, 28307);
    			attr_dev(table, "class", "table table-sm");
    			add_location(table, file$g, 870, 10, 28087);
    			attr_dev(span4, "class", "input-group-text");
    			attr_dev(span4, "id", "inputGroup-sizing-default");
    			add_location(span4, file$g, 1156, 16, 37572);
    			attr_dev(input18, "type", "number");
    			attr_dev(input18, "class", "form-control w-50 svelte-kwefzz");
    			attr_dev(input18, "placeholder", "금액 입력");
    			attr_dev(input18, "aria-label", "금액 입력");
    			add_location(input18, file$g, 1159, 16, 37696);
    			attr_dev(div21, "class", "input-group input-group-lg");
    			add_location(div21, file$g, 1155, 14, 37515);
    			attr_dev(div22, "class", "p-1");
    			add_location(div22, file$g, 1154, 12, 37483);
    			attr_dev(span5, "class", "input-group-text");
    			attr_dev(span5, "id", "inputGroup-sizing-default");
    			add_location(span5, file$g, 1170, 16, 38066);
    			attr_dev(input19, "type", "number");
    			attr_dev(input19, "class", "form-control w-50 svelte-kwefzz");
    			attr_dev(input19, "placeholder", "금액 입력");
    			attr_dev(input19, "aria-label", "금액 입력");
    			add_location(input19, file$g, 1173, 16, 38190);
    			attr_dev(div23, "class", "input-group input-group-lg");
    			add_location(div23, file$g, 1169, 14, 38009);
    			attr_dev(div24, "class", "p-1");
    			add_location(div24, file$g, 1168, 12, 37977);
    			attr_dev(button1, "class", "btn-success btn btn-lg h-100");
    			add_location(button1, file$g, 1183, 14, 38504);
    			attr_dev(div25, "class", "p-1");
    			add_location(div25, file$g, 1182, 12, 38472);
    			attr_dev(div26, "class", "d-flex  justify-content-end");
    			add_location(div26, file$g, 1153, 10, 37429);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, button0);
    			append_dev(button0, i);
    			append_dev(button0, t0);
    			if_block.m(button0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t3);
    			append_dev(tr0, th1);
    			append_dev(tr0, t5);
    			append_dev(tr0, th2);
    			append_dev(table, t7);
    			append_dev(table, tbody);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t9);
    			append_dev(tr1, td1);
    			append_dev(td1, div1);
    			append_dev(div1, input0);
    			input0.checked = /*resultData*/ ctx[0].angle;
    			append_dev(tr1, t10);
    			append_dev(tr1, td2);
    			append_dev(tbody, t11);
    			append_dev(tbody, tr2);
    			append_dev(tr2, td3);
    			append_dev(tr2, t13);
    			append_dev(tr2, td4);
    			append_dev(td4, div2);
    			append_dev(div2, input1);
    			input1.checked = /*resultData*/ ctx[0].stand;
    			append_dev(tr2, t14);
    			append_dev(tr2, td5);
    			append_dev(tbody, t15);
    			append_dev(tbody, tr3);
    			append_dev(tr3, td6);
    			append_dev(tr3, t17);
    			append_dev(tr3, td7);
    			append_dev(td7, div3);
    			append_dev(div3, input2);
    			input2.checked = /*resultData*/ ctx[0].holder;
    			append_dev(tr3, t18);
    			append_dev(tr3, td8);
    			append_dev(tbody, t19);
    			append_dev(tbody, tr4);
    			append_dev(tr4, td9);
    			append_dev(tr4, t21);
    			append_dev(tr4, td10);
    			append_dev(td10, div4);
    			append_dev(div4, input3);
    			input3.checked = /*resultData*/ ctx[0].pipe_extend;
    			append_dev(tr4, t22);
    			append_dev(tr4, td11);
    			append_dev(td11, div5);
    			append_dev(div5, input4);
    			set_input_value(input4, /*resultData*/ ctx[0].pipe_extend_length);
    			append_dev(div5, t23);
    			append_dev(div5, span0);
    			append_dev(tbody, t25);
    			append_dev(tbody, tr5);
    			append_dev(tr5, td12);
    			append_dev(tr5, t27);
    			append_dev(tr5, td13);
    			append_dev(td13, div6);
    			append_dev(div6, input5);
    			input5.checked = /*resultData*/ ctx[0].wrinkle;
    			append_dev(tr5, t28);
    			append_dev(tr5, td14);
    			append_dev(td14, div7);
    			append_dev(div7, input6);
    			set_input_value(input6, /*resultData*/ ctx[0].wrinkle_length);
    			append_dev(div7, t29);
    			append_dev(div7, span1);
    			append_dev(tbody, t31);
    			append_dev(tbody, tr6);
    			append_dev(tr6, td15);
    			append_dev(tr6, t33);
    			append_dev(tr6, td16);
    			append_dev(td16, div8);
    			append_dev(div8, input7);
    			input7.checked = /*resultData*/ ctx[0].welding;
    			append_dev(tr6, t34);
    			append_dev(tr6, td17);
    			append_dev(tbody, t35);
    			append_dev(tbody, tr7);
    			append_dev(tr7, td18);
    			append_dev(tr7, t37);
    			append_dev(tr7, td19);
    			append_dev(td19, div9);
    			append_dev(div9, input8);
    			input8.checked = /*resultData*/ ctx[0].gas;
    			append_dev(tr7, t38);
    			append_dev(tr7, td20);
    			append_dev(tbody, t39);
    			append_dev(tbody, tr8);
    			append_dev(tr8, td21);
    			append_dev(tr8, t41);
    			append_dev(tr8, td22);
    			append_dev(td22, div10);
    			append_dev(div10, input9);
    			input9.checked = /*resultData*/ ctx[0].drain_pump;
    			append_dev(tr8, t42);
    			append_dev(tr8, td23);
    			append_dev(td23, div11);
    			append_dev(div11, input10);
    			set_input_value(input10, /*resultData*/ ctx[0].drain_pump_length);
    			append_dev(div11, t43);
    			append_dev(div11, span2);
    			append_dev(tbody, t45);
    			append_dev(tbody, tr9);
    			append_dev(tr9, td24);
    			append_dev(tr9, t47);
    			append_dev(tr9, td25);
    			append_dev(td25, div12);
    			append_dev(div12, input11);
    			input11.checked = /*resultData*/ ctx[0].hole;
    			append_dev(tr9, t48);
    			append_dev(tr9, td26);
    			append_dev(td26, div13);
    			append_dev(div13, input12);
    			set_input_value(input12, /*resultData*/ ctx[0].hole_amount);
    			append_dev(div13, t49);
    			append_dev(div13, span3);
    			append_dev(tbody, t51);
    			append_dev(tbody, tr10);
    			append_dev(tr10, td27);
    			append_dev(tr10, t53);
    			append_dev(tr10, td28);
    			append_dev(td28, div14);
    			append_dev(div14, input13);
    			input13.checked = /*resultData*/ ctx[0].danger_fee;
    			append_dev(tr10, t54);
    			append_dev(tr10, td29);
    			append_dev(tbody, t55);
    			append_dev(tbody, tr11);
    			append_dev(tr11, td30);
    			append_dev(tr11, t57);
    			append_dev(tr11, td31);
    			append_dev(td31, div15);
    			append_dev(div15, input14);
    			input14.checked = /*resultData*/ ctx[0].drain_kit;
    			append_dev(tr11, t58);
    			append_dev(tr11, td32);
    			append_dev(tbody, t59);
    			append_dev(tbody, tr12);
    			append_dev(tr12, td33);
    			append_dev(tr12, t61);
    			append_dev(tr12, td34);
    			append_dev(td34, div16);
    			append_dev(div16, input15);
    			input15.checked = /*resultData*/ ctx[0].union_kit;
    			append_dev(tr12, t62);
    			append_dev(tr12, td35);
    			append_dev(tbody, t63);
    			append_dev(tbody, tr13);
    			append_dev(tr13, td36);
    			append_dev(tr13, t65);
    			append_dev(tr13, td37);
    			append_dev(td37, div17);
    			append_dev(div17, input16);
    			input16.checked = /*resultData*/ ctx[0].power_line;
    			append_dev(tr13, t66);
    			append_dev(tr13, td38);
    			append_dev(tbody, t67);
    			append_dev(tbody, tr14);
    			append_dev(tr14, td39);
    			append_dev(tr14, t69);
    			append_dev(tr14, td40);
    			append_dev(td40, div18);
    			append_dev(div18, input17);
    			input17.checked = /*resultData*/ ctx[0].air_guide;
    			append_dev(tr14, t70);
    			append_dev(tr14, td41);
    			append_dev(tbody, t71);
    			append_dev(tbody, tr15);
    			append_dev(tr15, td42);
    			append_dev(td42, div19);
    			append_dev(td42, t73);
    			append_dev(td42, div20);
    			append_dev(div20, textarea);
    			set_input_value(textarea, /*resultData*/ ctx[0].comment);
    			insert_dev(target, t74, anchor);
    			mount_component(alert, target, anchor);
    			insert_dev(target, t75, anchor);
    			insert_dev(target, div26, anchor);
    			append_dev(div26, div22);
    			append_dev(div22, div21);
    			append_dev(div21, span4);
    			append_dev(div21, t77);
    			append_dev(div21, input18);
    			set_input_value(input18, /*resultData*/ ctx[0].price_low);
    			append_dev(div26, t78);
    			append_dev(div26, div24);
    			append_dev(div24, div23);
    			append_dev(div23, span5);
    			append_dev(div23, t80);
    			append_dev(div23, input19);
    			set_input_value(input19, /*resultData*/ ctx[0].price_high);
    			append_dev(div26, t81);
    			append_dev(div26, div25);
    			append_dev(div25, button1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_4*/ ctx[59], false, false, false),
    					listen_dev(input0, "change", /*input0_change_handler_2*/ ctx[60]),
    					listen_dev(input1, "change", /*input1_change_handler_2*/ ctx[61]),
    					listen_dev(input2, "change", /*input2_change_handler_2*/ ctx[62]),
    					listen_dev(input3, "change", /*input3_change_handler_2*/ ctx[63]),
    					listen_dev(input4, "input", /*input4_input_handler_2*/ ctx[64]),
    					listen_dev(input5, "change", /*input5_change_handler_2*/ ctx[65]),
    					listen_dev(input6, "input", /*input6_input_handler_2*/ ctx[66]),
    					listen_dev(input7, "change", /*input7_change_handler_2*/ ctx[67]),
    					listen_dev(input8, "change", /*input8_change_handler_2*/ ctx[68]),
    					listen_dev(input9, "change", /*input9_change_handler_2*/ ctx[69]),
    					listen_dev(input10, "input", /*input10_input_handler_2*/ ctx[70]),
    					listen_dev(input11, "change", /*input11_change_handler_2*/ ctx[71]),
    					listen_dev(input12, "input", /*input12_input_handler_2*/ ctx[72]),
    					listen_dev(input13, "change", /*input13_change_handler_2*/ ctx[73]),
    					listen_dev(input14, "change", /*input14_change_handler_2*/ ctx[74]),
    					listen_dev(input15, "change", /*input15_change_handler_2*/ ctx[75]),
    					listen_dev(input16, "change", /*input16_change_handler_2*/ ctx[76]),
    					listen_dev(input17, "change", /*input17_change_handler_2*/ ctx[77]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[78]),
    					listen_dev(input18, "input", /*input18_input_handler_2*/ ctx[81]),
    					listen_dev(input19, "input", /*input19_input_handler_2*/ ctx[82]),
    					listen_dev(button1, "click", /*handleUpdate*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type_2(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button0, null);
    				}
    			}

    			if (dirty[0] & /*modify*/ 32) {
    				toggle_class(button0, "btn-warning", /*modify*/ ctx[5]);
    			}

    			if (dirty[0] & /*modify*/ 32) {
    				toggle_class(button0, "btn-light", !/*modify*/ ctx[5]);
    			}

    			if (!current || dirty[0] & /*modify*/ 32 && input0_disabled_value !== (input0_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input0, "disabled", input0_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input0.checked = /*resultData*/ ctx[0].angle;
    			}

    			if (!current || dirty[0] & /*modify*/ 32 && input1_disabled_value !== (input1_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input1, "disabled", input1_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input1.checked = /*resultData*/ ctx[0].stand;
    			}

    			if (!current || dirty[0] & /*modify*/ 32 && input2_disabled_value !== (input2_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input2, "disabled", input2_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input2.checked = /*resultData*/ ctx[0].holder;
    			}

    			if (!current || dirty[0] & /*modify*/ 32 && input3_disabled_value !== (input3_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input3, "disabled", input3_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input3.checked = /*resultData*/ ctx[0].pipe_extend;
    			}

    			if (!current || dirty[0] & /*modify, resultData*/ 33 && input4_disabled_value !== (input4_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].pipe_extend))) {
    				prop_dev(input4, "disabled", input4_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1 && to_number(input4.value) !== /*resultData*/ ctx[0].pipe_extend_length) {
    				set_input_value(input4, /*resultData*/ ctx[0].pipe_extend_length);
    			}

    			if (!current || dirty[0] & /*modify*/ 32 && input5_disabled_value !== (input5_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input5, "disabled", input5_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input5.checked = /*resultData*/ ctx[0].wrinkle;
    			}

    			if (!current || dirty[0] & /*modify, resultData*/ 33 && input6_disabled_value !== (input6_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].wrinkle))) {
    				prop_dev(input6, "disabled", input6_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1 && to_number(input6.value) !== /*resultData*/ ctx[0].wrinkle_length) {
    				set_input_value(input6, /*resultData*/ ctx[0].wrinkle_length);
    			}

    			if (!current || dirty[0] & /*modify*/ 32 && input7_disabled_value !== (input7_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input7, "disabled", input7_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input7.checked = /*resultData*/ ctx[0].welding;
    			}

    			if (!current || dirty[0] & /*modify*/ 32 && input8_disabled_value !== (input8_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input8, "disabled", input8_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input8.checked = /*resultData*/ ctx[0].gas;
    			}

    			if (!current || dirty[0] & /*modify*/ 32 && input9_disabled_value !== (input9_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input9, "disabled", input9_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input9.checked = /*resultData*/ ctx[0].drain_pump;
    			}

    			if (!current || dirty[0] & /*modify, resultData*/ 33 && input10_disabled_value !== (input10_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].drain_pump))) {
    				prop_dev(input10, "disabled", input10_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1 && to_number(input10.value) !== /*resultData*/ ctx[0].drain_pump_length) {
    				set_input_value(input10, /*resultData*/ ctx[0].drain_pump_length);
    			}

    			if (!current || dirty[0] & /*modify*/ 32 && input11_disabled_value !== (input11_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input11, "disabled", input11_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input11.checked = /*resultData*/ ctx[0].hole;
    			}

    			if (!current || dirty[0] & /*modify, resultData*/ 33 && input12_disabled_value !== (input12_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].hole))) {
    				prop_dev(input12, "disabled", input12_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1 && to_number(input12.value) !== /*resultData*/ ctx[0].hole_amount) {
    				set_input_value(input12, /*resultData*/ ctx[0].hole_amount);
    			}

    			if (!current || dirty[0] & /*modify*/ 32 && input13_disabled_value !== (input13_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input13, "disabled", input13_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input13.checked = /*resultData*/ ctx[0].danger_fee;
    			}

    			if (!current || dirty[0] & /*modify*/ 32 && input14_disabled_value !== (input14_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input14, "disabled", input14_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input14.checked = /*resultData*/ ctx[0].drain_kit;
    			}

    			if (!current || dirty[0] & /*modify*/ 32 && input15_disabled_value !== (input15_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input15, "disabled", input15_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input15.checked = /*resultData*/ ctx[0].union_kit;
    			}

    			if (!current || dirty[0] & /*modify*/ 32 && input16_disabled_value !== (input16_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input16, "disabled", input16_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input16.checked = /*resultData*/ ctx[0].power_line;
    			}

    			if (!current || dirty[0] & /*modify*/ 32 && input17_disabled_value !== (input17_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input17, "disabled", input17_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input17.checked = /*resultData*/ ctx[0].air_guide;
    			}

    			if (!current || dirty[0] & /*modify*/ 32 && textarea_disabled_value !== (textarea_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(textarea, "disabled", textarea_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				set_input_value(textarea, /*resultData*/ ctx[0].comment);
    			}

    			const alert_changes = {};

    			if (!updating_showAlert && dirty[0] & /*showAlert*/ 4) {
    				updating_showAlert = true;
    				alert_changes.showAlert = /*showAlert*/ ctx[2];
    				add_flush_callback(() => updating_showAlert = false);
    			}

    			if (!updating_message && dirty[0] & /*message*/ 8) {
    				updating_message = true;
    				alert_changes.message = /*message*/ ctx[3];
    				add_flush_callback(() => updating_message = false);
    			}

    			alert.$set(alert_changes);

    			if (dirty[0] & /*resultData*/ 1 && to_number(input18.value) !== /*resultData*/ ctx[0].price_low) {
    				set_input_value(input18, /*resultData*/ ctx[0].price_low);
    			}

    			if (dirty[0] & /*resultData*/ 1 && to_number(input19.value) !== /*resultData*/ ctx[0].price_high) {
    				set_input_value(input19, /*resultData*/ ctx[0].price_high);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(alert.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(alert.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if_block.d();
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(table);
    			if (detaching) detach_dev(t74);
    			destroy_component(alert, detaching);
    			if (detaching) detach_dev(t75);
    			if (detaching) detach_dev(div26);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(859:30) ",
    		ctx
    	});

    	return block;
    }

    // (539:30) 
    function create_if_block_2$1(ctx) {
    	let table;
    	let thead;
    	let tr0;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let tbody;
    	let tr1;
    	let td0;
    	let t7;
    	let td1;
    	let div0;
    	let input0;
    	let input0_disabled_value;
    	let t8;
    	let td2;
    	let t9;
    	let tr2;
    	let td3;
    	let t11;
    	let td4;
    	let div1;
    	let input1;
    	let input1_disabled_value;
    	let t12;
    	let td5;
    	let t13;
    	let tr3;
    	let td6;
    	let t15;
    	let td7;
    	let div2;
    	let input2;
    	let input2_disabled_value;
    	let t16;
    	let td8;
    	let t17;
    	let tr4;
    	let td9;
    	let t19;
    	let td10;
    	let div3;
    	let input3;
    	let input3_disabled_value;
    	let t20;
    	let td11;
    	let div4;
    	let input4;
    	let input4_disabled_value;
    	let t21;
    	let span0;
    	let t23;
    	let tr5;
    	let td12;
    	let t25;
    	let td13;
    	let div5;
    	let input5;
    	let input5_disabled_value;
    	let t26;
    	let td14;
    	let div6;
    	let input6;
    	let input6_disabled_value;
    	let t27;
    	let span1;
    	let t29;
    	let tr6;
    	let td15;
    	let t31;
    	let td16;
    	let div7;
    	let input7;
    	let input7_disabled_value;
    	let t32;
    	let td17;
    	let t33;
    	let tr7;
    	let td18;
    	let t35;
    	let td19;
    	let div8;
    	let input8;
    	let input8_disabled_value;
    	let t36;
    	let td20;
    	let t37;
    	let tr8;
    	let td21;
    	let t39;
    	let td22;
    	let div9;
    	let input9;
    	let input9_disabled_value;
    	let t40;
    	let td23;
    	let div10;
    	let input10;
    	let input10_disabled_value;
    	let t41;
    	let span2;
    	let t43;
    	let tr9;
    	let td24;
    	let t45;
    	let td25;
    	let div11;
    	let input11;
    	let input11_disabled_value;
    	let t46;
    	let td26;
    	let div12;
    	let input12;
    	let input12_disabled_value;
    	let t47;
    	let span3;
    	let t49;
    	let tr10;
    	let td27;
    	let t51;
    	let td28;
    	let div13;
    	let input13;
    	let input13_disabled_value;
    	let t52;
    	let td29;
    	let t53;
    	let tr11;
    	let td30;
    	let t55;
    	let td31;
    	let div14;
    	let input14;
    	let input14_disabled_value;
    	let t56;
    	let td32;
    	let t57;
    	let tr12;
    	let td33;
    	let t59;
    	let td34;
    	let div15;
    	let input15;
    	let input15_disabled_value;
    	let t60;
    	let td35;
    	let t61;
    	let tr13;
    	let td36;
    	let t63;
    	let td37;
    	let div16;
    	let input16;
    	let input16_disabled_value;
    	let t64;
    	let td38;
    	let t65;
    	let tr14;
    	let td39;
    	let t67;
    	let td40;
    	let div17;
    	let input17;
    	let input17_disabled_value;
    	let t68;
    	let td41;
    	let t69;
    	let div22;
    	let div19;
    	let div18;
    	let span4;
    	let t71;
    	let input18;
    	let t72;
    	let div21;
    	let div20;
    	let span5;
    	let t74;
    	let input19;
    	let t75;
    	let div25;
    	let div23;
    	let button0;
    	let small;
    	let t77;
    	let t78;
    	let div24;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "구분";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "결과";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "비고";
    			t5 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "앵글";
    			t7 = space();
    			td1 = element("td");
    			div0 = element("div");
    			input0 = element("input");
    			t8 = space();
    			td2 = element("td");
    			t9 = space();
    			tr2 = element("tr");
    			td3 = element("td");
    			td3.textContent = "실외기스탠드";
    			t11 = space();
    			td4 = element("td");
    			div1 = element("div");
    			input1 = element("input");
    			t12 = space();
    			td5 = element("td");
    			t13 = space();
    			tr3 = element("tr");
    			td6 = element("td");
    			td6.textContent = "실외기고정(컷팅반도)";
    			t15 = space();
    			td7 = element("td");
    			div2 = element("div");
    			input2 = element("input");
    			t16 = space();
    			td8 = element("td");
    			t17 = space();
    			tr4 = element("tr");
    			td9 = element("td");
    			td9.textContent = "배관 연장";
    			t19 = space();
    			td10 = element("td");
    			div3 = element("div");
    			input3 = element("input");
    			t20 = space();
    			td11 = element("td");
    			div4 = element("div");
    			input4 = element("input");
    			t21 = space();
    			span0 = element("span");
    			span0.textContent = "m";
    			t23 = space();
    			tr5 = element("tr");
    			td12 = element("td");
    			td12.textContent = "주름 배관";
    			t25 = space();
    			td13 = element("td");
    			div5 = element("div");
    			input5 = element("input");
    			t26 = space();
    			td14 = element("td");
    			div6 = element("div");
    			input6 = element("input");
    			t27 = space();
    			span1 = element("span");
    			span1.textContent = "m";
    			t29 = space();
    			tr6 = element("tr");
    			td15 = element("td");
    			td15.textContent = "배관 용접";
    			t31 = space();
    			td16 = element("td");
    			div7 = element("div");
    			input7 = element("input");
    			t32 = space();
    			td17 = element("td");
    			t33 = space();
    			tr7 = element("tr");
    			td18 = element("td");
    			td18.textContent = "냉매 보충";
    			t35 = space();
    			td19 = element("td");
    			div8 = element("div");
    			input8 = element("input");
    			t36 = space();
    			td20 = element("td");
    			t37 = space();
    			tr8 = element("tr");
    			td21 = element("td");
    			td21.textContent = "드레인 펌프";
    			t39 = space();
    			td22 = element("td");
    			div9 = element("div");
    			input9 = element("input");
    			t40 = space();
    			td23 = element("td");
    			div10 = element("div");
    			input10 = element("input");
    			t41 = space();
    			span2 = element("span");
    			span2.textContent = "m";
    			t43 = space();
    			tr9 = element("tr");
    			td24 = element("td");
    			td24.textContent = "추가 타공";
    			t45 = space();
    			td25 = element("td");
    			div11 = element("div");
    			input11 = element("input");
    			t46 = space();
    			td26 = element("td");
    			div12 = element("div");
    			input12 = element("input");
    			t47 = space();
    			span3 = element("span");
    			span3.textContent = "m";
    			t49 = space();
    			tr10 = element("tr");
    			td27 = element("td");
    			td27.textContent = "실외기 설치 위험수당";
    			t51 = space();
    			td28 = element("td");
    			div13 = element("div");
    			input13 = element("input");
    			t52 = space();
    			td29 = element("td");
    			t53 = space();
    			tr11 = element("tr");
    			td30 = element("td");
    			td30.textContent = "드레인 키트";
    			t55 = space();
    			td31 = element("td");
    			div14 = element("div");
    			input14 = element("input");
    			t56 = space();
    			td32 = element("td");
    			t57 = space();
    			tr12 = element("tr");
    			td33 = element("td");
    			td33.textContent = "유니온";
    			t59 = space();
    			td34 = element("td");
    			div15 = element("div");
    			input15 = element("input");
    			t60 = space();
    			td35 = element("td");
    			t61 = space();
    			tr13 = element("tr");
    			td36 = element("td");
    			td36.textContent = "전원선 연장";
    			t63 = space();
    			td37 = element("td");
    			div16 = element("div");
    			input16 = element("input");
    			t64 = space();
    			td38 = element("td");
    			t65 = space();
    			tr14 = element("tr");
    			td39 = element("td");
    			td39.textContent = "에어 가이드";
    			t67 = space();
    			td40 = element("td");
    			div17 = element("div");
    			input17 = element("input");
    			t68 = space();
    			td41 = element("td");
    			t69 = space();
    			div22 = element("div");
    			div19 = element("div");
    			div18 = element("div");
    			span4 = element("span");
    			span4.textContent = "최소";
    			t71 = space();
    			input18 = element("input");
    			t72 = space();
    			div21 = element("div");
    			div20 = element("div");
    			span5 = element("span");
    			span5.textContent = "최대";
    			t74 = space();
    			input19 = element("input");
    			t75 = space();
    			div25 = element("div");
    			div23 = element("div");
    			button0 = element("button");
    			small = element("small");
    			small.textContent = "상태 되돌리기:";
    			t77 = text(" 확인이전");
    			t78 = space();
    			div24 = element("div");
    			button1 = element("button");
    			button1.textContent = "고객 답변 완료";
    			add_location(th0, file$g, 542, 16, 17218);
    			add_location(th1, file$g, 543, 16, 17246);
    			attr_dev(th2, "class", "w-25");
    			add_location(th2, file$g, 544, 16, 17274);
    			add_location(tr0, file$g, 541, 14, 17197);
    			add_location(thead, file$g, 540, 12, 17175);
    			add_location(td0, file$g, 549, 16, 17395);
    			attr_dev(input0, "class", "form-check-input");
    			attr_dev(input0, "type", "checkbox");
    			input0.disabled = input0_disabled_value = !/*modify*/ ctx[5];
    			add_location(input0, file$g, 552, 20, 17520);
    			attr_dev(div0, "class", "form-check d-flex justify-content-start");
    			add_location(div0, file$g, 551, 18, 17446);
    			add_location(td1, file$g, 550, 16, 17423);
    			add_location(td2, file$g, 560, 16, 17793);
    			add_location(tr1, file$g, 548, 14, 17374);
    			add_location(td3, file$g, 564, 16, 17856);
    			attr_dev(input1, "class", "form-check-input");
    			attr_dev(input1, "type", "checkbox");
    			input1.disabled = input1_disabled_value = !/*modify*/ ctx[5];
    			add_location(input1, file$g, 567, 20, 17985);
    			attr_dev(div1, "class", "form-check d-flex justify-content-start");
    			add_location(div1, file$g, 566, 19, 17911);
    			add_location(td4, file$g, 565, 16, 17888);
    			add_location(td5, file$g, 575, 16, 18258);
    			add_location(tr2, file$g, 563, 14, 17835);
    			add_location(td6, file$g, 579, 16, 18321);
    			attr_dev(input2, "class", "form-check-input");
    			attr_dev(input2, "type", "checkbox");
    			input2.disabled = input2_disabled_value = !/*modify*/ ctx[5];
    			add_location(input2, file$g, 582, 20, 18455);
    			attr_dev(div2, "class", "form-check d-flex justify-content-start");
    			add_location(div2, file$g, 581, 18, 18381);
    			add_location(td7, file$g, 580, 16, 18358);
    			add_location(td8, file$g, 590, 16, 18729);
    			add_location(tr3, file$g, 578, 14, 18300);
    			add_location(td9, file$g, 594, 16, 18792);
    			attr_dev(input3, "class", "form-check-input");
    			attr_dev(input3, "type", "checkbox");
    			input3.disabled = input3_disabled_value = !/*modify*/ ctx[5];
    			add_location(input3, file$g, 597, 20, 18920);
    			attr_dev(div3, "class", "form-check d-flex justify-content-start");
    			add_location(div3, file$g, 596, 19, 18846);
    			add_location(td10, file$g, 595, 16, 18823);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "class", "form-control w-50 svelte-kwefzz");
    			attr_dev(input4, "placeholder", "필요 길이");
    			attr_dev(input4, "aria-label", "필요 길이");
    			input4.disabled = input4_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].pipe_extend);
    			add_location(input4, file$g, 607, 20, 19283);
    			attr_dev(span0, "class", "input-group-text");
    			add_location(span0, file$g, 615, 20, 19634);
    			attr_dev(div4, "class", "input-group input-group-sm");
    			add_location(div4, file$g, 606, 18, 19222);
    			add_location(td11, file$g, 605, 16, 19199);
    			add_location(tr4, file$g, 593, 14, 18771);
    			add_location(td12, file$g, 621, 16, 19779);
    			attr_dev(input5, "class", "form-check-input");
    			attr_dev(input5, "type", "checkbox");
    			input5.disabled = input5_disabled_value = !/*modify*/ ctx[5];
    			add_location(input5, file$g, 624, 20, 19907);
    			attr_dev(div5, "class", "form-check d-flex justify-content-start");
    			add_location(div5, file$g, 623, 19, 19833);
    			add_location(td13, file$g, 622, 16, 19810);
    			attr_dev(input6, "type", "number");
    			attr_dev(input6, "class", "form-control w-50 svelte-kwefzz");
    			attr_dev(input6, "placeholder", "필요 길이");
    			attr_dev(input6, "aria-label", "필요 길이");
    			input6.disabled = input6_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].wrinkle);
    			add_location(input6, file$g, 634, 20, 20266);
    			attr_dev(span1, "class", "input-group-text");
    			add_location(span1, file$g, 642, 20, 20609);
    			attr_dev(div6, "class", "input-group input-group-sm");
    			add_location(div6, file$g, 633, 18, 20205);
    			add_location(td14, file$g, 632, 16, 20182);
    			add_location(tr5, file$g, 620, 14, 19758);
    			add_location(td15, file$g, 648, 16, 20754);
    			attr_dev(input7, "class", "form-check-input");
    			attr_dev(input7, "type", "checkbox");
    			input7.disabled = input7_disabled_value = !/*modify*/ ctx[5];
    			add_location(input7, file$g, 651, 20, 20882);
    			attr_dev(div7, "class", "form-check d-flex justify-content-start");
    			add_location(div7, file$g, 650, 18, 20808);
    			add_location(td16, file$g, 649, 16, 20785);
    			add_location(td17, file$g, 659, 16, 21157);
    			add_location(tr6, file$g, 647, 14, 20733);
    			add_location(td18, file$g, 663, 16, 21220);
    			attr_dev(input8, "class", "form-check-input");
    			attr_dev(input8, "type", "checkbox");
    			input8.disabled = input8_disabled_value = !/*modify*/ ctx[5];
    			add_location(input8, file$g, 666, 20, 21348);
    			attr_dev(div8, "class", "form-check d-flex justify-content-start");
    			add_location(div8, file$g, 665, 18, 21274);
    			add_location(td19, file$g, 664, 16, 21251);
    			add_location(td20, file$g, 674, 16, 21619);
    			add_location(tr7, file$g, 662, 14, 21199);
    			add_location(td21, file$g, 678, 16, 21682);
    			attr_dev(input9, "class", "form-check-input");
    			attr_dev(input9, "type", "checkbox");
    			input9.disabled = input9_disabled_value = !/*modify*/ ctx[5];
    			add_location(input9, file$g, 681, 20, 21811);
    			attr_dev(div9, "class", "form-check d-flex justify-content-start");
    			add_location(div9, file$g, 680, 19, 21737);
    			add_location(td22, file$g, 679, 16, 21714);
    			attr_dev(input10, "type", "number");
    			attr_dev(input10, "class", "form-control w-50 svelte-kwefzz");
    			attr_dev(input10, "placeholder", "필요 길이");
    			attr_dev(input10, "aria-label", "필요 길이");
    			input10.disabled = input10_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].drain_pump);
    			add_location(input10, file$g, 691, 20, 22173);
    			attr_dev(span2, "class", "input-group-text");
    			add_location(span2, file$g, 699, 20, 22522);
    			attr_dev(div10, "class", "input-group input-group-sm");
    			add_location(div10, file$g, 690, 18, 22112);
    			add_location(td23, file$g, 689, 16, 22089);
    			add_location(tr8, file$g, 677, 14, 21661);
    			add_location(td24, file$g, 705, 16, 22667);
    			attr_dev(input11, "class", "form-check-input");
    			attr_dev(input11, "type", "checkbox");
    			input11.disabled = input11_disabled_value = !/*modify*/ ctx[5];
    			add_location(input11, file$g, 708, 20, 22795);
    			attr_dev(div11, "class", "form-check d-flex justify-content-start");
    			add_location(div11, file$g, 707, 19, 22721);
    			add_location(td25, file$g, 706, 16, 22698);
    			attr_dev(input12, "type", "number");
    			attr_dev(input12, "class", "form-control w-50 svelte-kwefzz");
    			attr_dev(input12, "placeholder", "타공 횟수");
    			attr_dev(input12, "aria-label", "타공 횟수");
    			input12.disabled = input12_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].hole);
    			add_location(input12, file$g, 718, 20, 23151);
    			attr_dev(span3, "class", "input-group-text");
    			add_location(span3, file$g, 726, 20, 23488);
    			attr_dev(div12, "class", "input-group input-group-sm");
    			add_location(div12, file$g, 717, 18, 23090);
    			add_location(td26, file$g, 716, 16, 23067);
    			add_location(tr9, file$g, 704, 14, 22646);
    			add_location(td27, file$g, 732, 16, 23633);
    			attr_dev(input13, "class", "form-check-input");
    			attr_dev(input13, "type", "checkbox");
    			input13.disabled = input13_disabled_value = !/*modify*/ ctx[5];
    			add_location(input13, file$g, 735, 20, 23767);
    			attr_dev(div13, "class", "form-check d-flex justify-content-start");
    			add_location(div13, file$g, 734, 18, 23693);
    			add_location(td28, file$g, 733, 16, 23670);
    			add_location(td29, file$g, 743, 16, 24045);
    			add_location(tr10, file$g, 731, 14, 23612);
    			add_location(td30, file$g, 747, 16, 24108);
    			attr_dev(input14, "class", "form-check-input");
    			attr_dev(input14, "type", "checkbox");
    			input14.disabled = input14_disabled_value = !/*modify*/ ctx[5];
    			add_location(input14, file$g, 750, 20, 24237);
    			attr_dev(div14, "class", "form-check d-flex justify-content-start");
    			add_location(div14, file$g, 749, 18, 24163);
    			add_location(td31, file$g, 748, 16, 24140);
    			add_location(td32, file$g, 758, 16, 24514);
    			add_location(tr11, file$g, 746, 14, 24087);
    			add_location(td33, file$g, 762, 16, 24577);
    			attr_dev(input15, "class", "form-check-input");
    			attr_dev(input15, "type", "checkbox");
    			input15.disabled = input15_disabled_value = !/*modify*/ ctx[5];
    			add_location(input15, file$g, 765, 20, 24703);
    			attr_dev(div15, "class", "form-check d-flex justify-content-start");
    			add_location(div15, file$g, 764, 18, 24629);
    			add_location(td34, file$g, 763, 16, 24606);
    			add_location(td35, file$g, 773, 16, 24980);
    			add_location(tr12, file$g, 761, 14, 24556);
    			add_location(td36, file$g, 777, 16, 25043);
    			attr_dev(input16, "class", "form-check-input");
    			attr_dev(input16, "type", "checkbox");
    			input16.disabled = input16_disabled_value = !/*modify*/ ctx[5];
    			add_location(input16, file$g, 780, 20, 25172);
    			attr_dev(div16, "class", "form-check d-flex justify-content-start");
    			add_location(div16, file$g, 779, 18, 25098);
    			add_location(td37, file$g, 778, 16, 25075);
    			add_location(td38, file$g, 788, 16, 25450);
    			add_location(tr13, file$g, 776, 14, 25022);
    			add_location(td39, file$g, 792, 16, 25513);
    			attr_dev(input17, "class", "form-check-input");
    			attr_dev(input17, "type", "checkbox");
    			input17.disabled = input17_disabled_value = !/*modify*/ ctx[5];
    			add_location(input17, file$g, 795, 20, 25642);
    			attr_dev(div17, "class", "form-check d-flex justify-content-start");
    			add_location(div17, file$g, 794, 18, 25568);
    			add_location(td40, file$g, 793, 16, 25545);
    			add_location(td41, file$g, 803, 16, 25919);
    			add_location(tr14, file$g, 791, 14, 25492);
    			add_location(tbody, file$g, 547, 12, 17352);
    			attr_dev(table, "class", "table table-sm");
    			add_location(table, file$g, 539, 10, 17132);
    			attr_dev(span4, "class", "input-group-text");
    			attr_dev(span4, "id", "inputGroup-sizing-default");
    			add_location(span4, file$g, 810, 16, 26138);
    			attr_dev(input18, "type", "number");
    			attr_dev(input18, "class", "form-control w-50 svelte-kwefzz");
    			attr_dev(input18, "placeholder", "금액 입력");
    			attr_dev(input18, "aria-label", "금액 입력");
    			input18.disabled = true;
    			add_location(input18, file$g, 813, 16, 26262);
    			attr_dev(div18, "class", "input-group input-group-lg");
    			add_location(div18, file$g, 809, 14, 26081);
    			attr_dev(div19, "class", "p-1");
    			add_location(div19, file$g, 808, 12, 26049);
    			attr_dev(span5, "class", "input-group-text");
    			attr_dev(span5, "id", "inputGroup-sizing-default");
    			add_location(span5, file$g, 825, 16, 26659);
    			attr_dev(input19, "type", "number");
    			attr_dev(input19, "class", "form-control w-50 svelte-kwefzz");
    			attr_dev(input19, "placeholder", "금액 입력");
    			attr_dev(input19, "aria-label", "금액 입력");
    			input19.disabled = true;
    			add_location(input19, file$g, 828, 16, 26783);
    			attr_dev(div20, "class", "input-group input-group-lg");
    			add_location(div20, file$g, 824, 14, 26602);
    			attr_dev(div21, "class", "p-1");
    			add_location(div21, file$g, 823, 12, 26570);
    			attr_dev(div22, "class", "d-flex justify-content-end");
    			add_location(div22, file$g, 807, 10, 25996);
    			add_location(small, file$g, 845, 16, 27320);
    			attr_dev(button0, "class", "btn btn-lg w-100 btn-danger");
    			add_location(button0, file$g, 841, 14, 27179);
    			attr_dev(div23, "class", "col");
    			add_location(div23, file$g, 840, 12, 27147);
    			attr_dev(button1, "class", "btn btn-lg w-100 btn-warning");
    			add_location(button1, file$g, 850, 14, 27437);
    			attr_dev(div24, "class", "col");
    			add_location(div24, file$g, 849, 12, 27405);
    			attr_dev(div25, "class", "row pt-4 pb-2");
    			add_location(div25, file$g, 839, 10, 27107);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t1);
    			append_dev(tr0, th1);
    			append_dev(tr0, t3);
    			append_dev(tr0, th2);
    			append_dev(table, t5);
    			append_dev(table, tbody);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t7);
    			append_dev(tr1, td1);
    			append_dev(td1, div0);
    			append_dev(div0, input0);
    			input0.checked = /*resultData*/ ctx[0].angle;
    			append_dev(tr1, t8);
    			append_dev(tr1, td2);
    			append_dev(tbody, t9);
    			append_dev(tbody, tr2);
    			append_dev(tr2, td3);
    			append_dev(tr2, t11);
    			append_dev(tr2, td4);
    			append_dev(td4, div1);
    			append_dev(div1, input1);
    			input1.checked = /*resultData*/ ctx[0].stand;
    			append_dev(tr2, t12);
    			append_dev(tr2, td5);
    			append_dev(tbody, t13);
    			append_dev(tbody, tr3);
    			append_dev(tr3, td6);
    			append_dev(tr3, t15);
    			append_dev(tr3, td7);
    			append_dev(td7, div2);
    			append_dev(div2, input2);
    			input2.checked = /*resultData*/ ctx[0].holder;
    			append_dev(tr3, t16);
    			append_dev(tr3, td8);
    			append_dev(tbody, t17);
    			append_dev(tbody, tr4);
    			append_dev(tr4, td9);
    			append_dev(tr4, t19);
    			append_dev(tr4, td10);
    			append_dev(td10, div3);
    			append_dev(div3, input3);
    			input3.checked = /*resultData*/ ctx[0].pipe_extend;
    			append_dev(tr4, t20);
    			append_dev(tr4, td11);
    			append_dev(td11, div4);
    			append_dev(div4, input4);
    			set_input_value(input4, /*resultData*/ ctx[0].pipe_extend_length);
    			append_dev(div4, t21);
    			append_dev(div4, span0);
    			append_dev(tbody, t23);
    			append_dev(tbody, tr5);
    			append_dev(tr5, td12);
    			append_dev(tr5, t25);
    			append_dev(tr5, td13);
    			append_dev(td13, div5);
    			append_dev(div5, input5);
    			input5.checked = /*resultData*/ ctx[0].wrinkle;
    			append_dev(tr5, t26);
    			append_dev(tr5, td14);
    			append_dev(td14, div6);
    			append_dev(div6, input6);
    			set_input_value(input6, /*resultData*/ ctx[0].wrinkle_length);
    			append_dev(div6, t27);
    			append_dev(div6, span1);
    			append_dev(tbody, t29);
    			append_dev(tbody, tr6);
    			append_dev(tr6, td15);
    			append_dev(tr6, t31);
    			append_dev(tr6, td16);
    			append_dev(td16, div7);
    			append_dev(div7, input7);
    			input7.checked = /*resultData*/ ctx[0].welding;
    			append_dev(tr6, t32);
    			append_dev(tr6, td17);
    			append_dev(tbody, t33);
    			append_dev(tbody, tr7);
    			append_dev(tr7, td18);
    			append_dev(tr7, t35);
    			append_dev(tr7, td19);
    			append_dev(td19, div8);
    			append_dev(div8, input8);
    			input8.checked = /*resultData*/ ctx[0].gas;
    			append_dev(tr7, t36);
    			append_dev(tr7, td20);
    			append_dev(tbody, t37);
    			append_dev(tbody, tr8);
    			append_dev(tr8, td21);
    			append_dev(tr8, t39);
    			append_dev(tr8, td22);
    			append_dev(td22, div9);
    			append_dev(div9, input9);
    			input9.checked = /*resultData*/ ctx[0].drain_pump;
    			append_dev(tr8, t40);
    			append_dev(tr8, td23);
    			append_dev(td23, div10);
    			append_dev(div10, input10);
    			set_input_value(input10, /*resultData*/ ctx[0].drain_pump_length);
    			append_dev(div10, t41);
    			append_dev(div10, span2);
    			append_dev(tbody, t43);
    			append_dev(tbody, tr9);
    			append_dev(tr9, td24);
    			append_dev(tr9, t45);
    			append_dev(tr9, td25);
    			append_dev(td25, div11);
    			append_dev(div11, input11);
    			input11.checked = /*resultData*/ ctx[0].hole;
    			append_dev(tr9, t46);
    			append_dev(tr9, td26);
    			append_dev(td26, div12);
    			append_dev(div12, input12);
    			set_input_value(input12, /*resultData*/ ctx[0].hole_amount);
    			append_dev(div12, t47);
    			append_dev(div12, span3);
    			append_dev(tbody, t49);
    			append_dev(tbody, tr10);
    			append_dev(tr10, td27);
    			append_dev(tr10, t51);
    			append_dev(tr10, td28);
    			append_dev(td28, div13);
    			append_dev(div13, input13);
    			input13.checked = /*resultData*/ ctx[0].danger_fee;
    			append_dev(tr10, t52);
    			append_dev(tr10, td29);
    			append_dev(tbody, t53);
    			append_dev(tbody, tr11);
    			append_dev(tr11, td30);
    			append_dev(tr11, t55);
    			append_dev(tr11, td31);
    			append_dev(td31, div14);
    			append_dev(div14, input14);
    			input14.checked = /*resultData*/ ctx[0].drain_kit;
    			append_dev(tr11, t56);
    			append_dev(tr11, td32);
    			append_dev(tbody, t57);
    			append_dev(tbody, tr12);
    			append_dev(tr12, td33);
    			append_dev(tr12, t59);
    			append_dev(tr12, td34);
    			append_dev(td34, div15);
    			append_dev(div15, input15);
    			input15.checked = /*resultData*/ ctx[0].union_kit;
    			append_dev(tr12, t60);
    			append_dev(tr12, td35);
    			append_dev(tbody, t61);
    			append_dev(tbody, tr13);
    			append_dev(tr13, td36);
    			append_dev(tr13, t63);
    			append_dev(tr13, td37);
    			append_dev(td37, div16);
    			append_dev(div16, input16);
    			input16.checked = /*resultData*/ ctx[0].power_line;
    			append_dev(tr13, t64);
    			append_dev(tr13, td38);
    			append_dev(tbody, t65);
    			append_dev(tbody, tr14);
    			append_dev(tr14, td39);
    			append_dev(tr14, t67);
    			append_dev(tr14, td40);
    			append_dev(td40, div17);
    			append_dev(div17, input17);
    			input17.checked = /*resultData*/ ctx[0].air_guide;
    			append_dev(tr14, t68);
    			append_dev(tr14, td41);
    			insert_dev(target, t69, anchor);
    			insert_dev(target, div22, anchor);
    			append_dev(div22, div19);
    			append_dev(div19, div18);
    			append_dev(div18, span4);
    			append_dev(div18, t71);
    			append_dev(div18, input18);
    			set_input_value(input18, /*resultData*/ ctx[0].price_low);
    			append_dev(div22, t72);
    			append_dev(div22, div21);
    			append_dev(div21, div20);
    			append_dev(div20, span5);
    			append_dev(div20, t74);
    			append_dev(div20, input19);
    			set_input_value(input19, /*resultData*/ ctx[0].price_high);
    			insert_dev(target, t75, anchor);
    			insert_dev(target, div25, anchor);
    			append_dev(div25, div23);
    			append_dev(div23, button0);
    			append_dev(button0, small);
    			append_dev(button0, t77);
    			append_dev(div25, t78);
    			append_dev(div25, div24);
    			append_dev(div24, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_handler_1*/ ctx[37]),
    					listen_dev(input1, "change", /*input1_change_handler_1*/ ctx[38]),
    					listen_dev(input2, "change", /*input2_change_handler_1*/ ctx[39]),
    					listen_dev(input3, "change", /*input3_change_handler_1*/ ctx[40]),
    					listen_dev(input4, "input", /*input4_input_handler_1*/ ctx[41]),
    					listen_dev(input5, "change", /*input5_change_handler_1*/ ctx[42]),
    					listen_dev(input6, "input", /*input6_input_handler_1*/ ctx[43]),
    					listen_dev(input7, "change", /*input7_change_handler_1*/ ctx[44]),
    					listen_dev(input8, "change", /*input8_change_handler_1*/ ctx[45]),
    					listen_dev(input9, "change", /*input9_change_handler_1*/ ctx[46]),
    					listen_dev(input10, "input", /*input10_input_handler_1*/ ctx[47]),
    					listen_dev(input11, "change", /*input11_change_handler_1*/ ctx[48]),
    					listen_dev(input12, "input", /*input12_input_handler_1*/ ctx[49]),
    					listen_dev(input13, "change", /*input13_change_handler_1*/ ctx[50]),
    					listen_dev(input14, "change", /*input14_change_handler_1*/ ctx[51]),
    					listen_dev(input15, "change", /*input15_change_handler_1*/ ctx[52]),
    					listen_dev(input16, "change", /*input16_change_handler_1*/ ctx[53]),
    					listen_dev(input17, "change", /*input17_change_handler_1*/ ctx[54]),
    					listen_dev(input18, "input", /*input18_input_handler_1*/ ctx[55]),
    					listen_dev(input19, "input", /*input19_input_handler_1*/ ctx[56]),
    					listen_dev(button0, "click", /*click_handler_2*/ ctx[57], false, false, false),
    					listen_dev(button1, "click", /*click_handler_3*/ ctx[58], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*modify*/ 32 && input0_disabled_value !== (input0_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input0, "disabled", input0_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input0.checked = /*resultData*/ ctx[0].angle;
    			}

    			if (dirty[0] & /*modify*/ 32 && input1_disabled_value !== (input1_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input1, "disabled", input1_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input1.checked = /*resultData*/ ctx[0].stand;
    			}

    			if (dirty[0] & /*modify*/ 32 && input2_disabled_value !== (input2_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input2, "disabled", input2_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input2.checked = /*resultData*/ ctx[0].holder;
    			}

    			if (dirty[0] & /*modify*/ 32 && input3_disabled_value !== (input3_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input3, "disabled", input3_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input3.checked = /*resultData*/ ctx[0].pipe_extend;
    			}

    			if (dirty[0] & /*modify, resultData*/ 33 && input4_disabled_value !== (input4_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].pipe_extend))) {
    				prop_dev(input4, "disabled", input4_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1 && to_number(input4.value) !== /*resultData*/ ctx[0].pipe_extend_length) {
    				set_input_value(input4, /*resultData*/ ctx[0].pipe_extend_length);
    			}

    			if (dirty[0] & /*modify*/ 32 && input5_disabled_value !== (input5_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input5, "disabled", input5_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input5.checked = /*resultData*/ ctx[0].wrinkle;
    			}

    			if (dirty[0] & /*modify, resultData*/ 33 && input6_disabled_value !== (input6_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].wrinkle))) {
    				prop_dev(input6, "disabled", input6_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1 && to_number(input6.value) !== /*resultData*/ ctx[0].wrinkle_length) {
    				set_input_value(input6, /*resultData*/ ctx[0].wrinkle_length);
    			}

    			if (dirty[0] & /*modify*/ 32 && input7_disabled_value !== (input7_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input7, "disabled", input7_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input7.checked = /*resultData*/ ctx[0].welding;
    			}

    			if (dirty[0] & /*modify*/ 32 && input8_disabled_value !== (input8_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input8, "disabled", input8_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input8.checked = /*resultData*/ ctx[0].gas;
    			}

    			if (dirty[0] & /*modify*/ 32 && input9_disabled_value !== (input9_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input9, "disabled", input9_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input9.checked = /*resultData*/ ctx[0].drain_pump;
    			}

    			if (dirty[0] & /*modify, resultData*/ 33 && input10_disabled_value !== (input10_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].drain_pump))) {
    				prop_dev(input10, "disabled", input10_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1 && to_number(input10.value) !== /*resultData*/ ctx[0].drain_pump_length) {
    				set_input_value(input10, /*resultData*/ ctx[0].drain_pump_length);
    			}

    			if (dirty[0] & /*modify*/ 32 && input11_disabled_value !== (input11_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input11, "disabled", input11_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input11.checked = /*resultData*/ ctx[0].hole;
    			}

    			if (dirty[0] & /*modify, resultData*/ 33 && input12_disabled_value !== (input12_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].hole))) {
    				prop_dev(input12, "disabled", input12_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1 && to_number(input12.value) !== /*resultData*/ ctx[0].hole_amount) {
    				set_input_value(input12, /*resultData*/ ctx[0].hole_amount);
    			}

    			if (dirty[0] & /*modify*/ 32 && input13_disabled_value !== (input13_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input13, "disabled", input13_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input13.checked = /*resultData*/ ctx[0].danger_fee;
    			}

    			if (dirty[0] & /*modify*/ 32 && input14_disabled_value !== (input14_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input14, "disabled", input14_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input14.checked = /*resultData*/ ctx[0].drain_kit;
    			}

    			if (dirty[0] & /*modify*/ 32 && input15_disabled_value !== (input15_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input15, "disabled", input15_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input15.checked = /*resultData*/ ctx[0].union_kit;
    			}

    			if (dirty[0] & /*modify*/ 32 && input16_disabled_value !== (input16_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input16, "disabled", input16_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input16.checked = /*resultData*/ ctx[0].power_line;
    			}

    			if (dirty[0] & /*modify*/ 32 && input17_disabled_value !== (input17_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input17, "disabled", input17_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input17.checked = /*resultData*/ ctx[0].air_guide;
    			}

    			if (dirty[0] & /*resultData*/ 1 && to_number(input18.value) !== /*resultData*/ ctx[0].price_low) {
    				set_input_value(input18, /*resultData*/ ctx[0].price_low);
    			}

    			if (dirty[0] & /*resultData*/ 1 && to_number(input19.value) !== /*resultData*/ ctx[0].price_high) {
    				set_input_value(input19, /*resultData*/ ctx[0].price_high);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			if (detaching) detach_dev(t69);
    			if (detaching) detach_dev(div22);
    			if (detaching) detach_dev(t75);
    			if (detaching) detach_dev(div25);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(539:30) ",
    		ctx
    	});

    	return block;
    }

    // (235:30) 
    function create_if_block_1$1(ctx) {
    	let table;
    	let thead;
    	let tr0;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let tbody;
    	let tr1;
    	let td0;
    	let t7;
    	let td1;
    	let div0;
    	let input0;
    	let input0_disabled_value;
    	let t8;
    	let td2;
    	let t9;
    	let tr2;
    	let td3;
    	let t11;
    	let td4;
    	let div1;
    	let input1;
    	let input1_disabled_value;
    	let t12;
    	let td5;
    	let t13;
    	let tr3;
    	let td6;
    	let t15;
    	let td7;
    	let div2;
    	let input2;
    	let input2_disabled_value;
    	let t16;
    	let td8;
    	let t17;
    	let tr4;
    	let td9;
    	let t19;
    	let td10;
    	let div3;
    	let input3;
    	let input3_disabled_value;
    	let t20;
    	let td11;
    	let div4;
    	let input4;
    	let input4_disabled_value;
    	let t21;
    	let span0;
    	let t23;
    	let tr5;
    	let td12;
    	let t25;
    	let td13;
    	let div5;
    	let input5;
    	let input5_disabled_value;
    	let t26;
    	let td14;
    	let div6;
    	let input6;
    	let input6_disabled_value;
    	let t27;
    	let span1;
    	let t29;
    	let tr6;
    	let td15;
    	let t31;
    	let td16;
    	let div7;
    	let input7;
    	let input7_disabled_value;
    	let t32;
    	let td17;
    	let t33;
    	let tr7;
    	let td18;
    	let t35;
    	let td19;
    	let div8;
    	let input8;
    	let input8_disabled_value;
    	let t36;
    	let td20;
    	let t37;
    	let tr8;
    	let td21;
    	let t39;
    	let td22;
    	let div9;
    	let input9;
    	let input9_disabled_value;
    	let t40;
    	let td23;
    	let div10;
    	let input10;
    	let input10_disabled_value;
    	let t41;
    	let span2;
    	let t43;
    	let tr9;
    	let td24;
    	let t45;
    	let td25;
    	let div11;
    	let input11;
    	let input11_disabled_value;
    	let t46;
    	let td26;
    	let div12;
    	let input12;
    	let input12_disabled_value;
    	let t47;
    	let span3;
    	let t49;
    	let tr10;
    	let td27;
    	let t51;
    	let td28;
    	let div13;
    	let input13;
    	let input13_disabled_value;
    	let t52;
    	let td29;
    	let t53;
    	let tr11;
    	let td30;
    	let t55;
    	let td31;
    	let div14;
    	let input14;
    	let input14_disabled_value;
    	let t56;
    	let td32;
    	let t57;
    	let tr12;
    	let td33;
    	let t59;
    	let td34;
    	let div15;
    	let input15;
    	let input15_disabled_value;
    	let t60;
    	let td35;
    	let t61;
    	let tr13;
    	let td36;
    	let t63;
    	let td37;
    	let div16;
    	let input16;
    	let input16_disabled_value;
    	let t64;
    	let td38;
    	let t65;
    	let tr14;
    	let td39;
    	let t67;
    	let td40;
    	let div17;
    	let input17;
    	let input17_disabled_value;
    	let t68;
    	let td41;
    	let t69;
    	let div22;
    	let div19;
    	let div18;
    	let span4;
    	let t71;
    	let input18;
    	let t72;
    	let div21;
    	let div20;
    	let span5;
    	let t74;
    	let input19;
    	let t75;
    	let div24;
    	let div23;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "구분";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "결과";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "비고";
    			t5 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "앵글";
    			t7 = space();
    			td1 = element("td");
    			div0 = element("div");
    			input0 = element("input");
    			t8 = space();
    			td2 = element("td");
    			t9 = space();
    			tr2 = element("tr");
    			td3 = element("td");
    			td3.textContent = "실외기스탠드";
    			t11 = space();
    			td4 = element("td");
    			div1 = element("div");
    			input1 = element("input");
    			t12 = space();
    			td5 = element("td");
    			t13 = space();
    			tr3 = element("tr");
    			td6 = element("td");
    			td6.textContent = "실외기고정(컷팅반도)";
    			t15 = space();
    			td7 = element("td");
    			div2 = element("div");
    			input2 = element("input");
    			t16 = space();
    			td8 = element("td");
    			t17 = space();
    			tr4 = element("tr");
    			td9 = element("td");
    			td9.textContent = "배관 연장";
    			t19 = space();
    			td10 = element("td");
    			div3 = element("div");
    			input3 = element("input");
    			t20 = space();
    			td11 = element("td");
    			div4 = element("div");
    			input4 = element("input");
    			t21 = space();
    			span0 = element("span");
    			span0.textContent = "m";
    			t23 = space();
    			tr5 = element("tr");
    			td12 = element("td");
    			td12.textContent = "주름 배관";
    			t25 = space();
    			td13 = element("td");
    			div5 = element("div");
    			input5 = element("input");
    			t26 = space();
    			td14 = element("td");
    			div6 = element("div");
    			input6 = element("input");
    			t27 = space();
    			span1 = element("span");
    			span1.textContent = "m";
    			t29 = space();
    			tr6 = element("tr");
    			td15 = element("td");
    			td15.textContent = "배관 용접";
    			t31 = space();
    			td16 = element("td");
    			div7 = element("div");
    			input7 = element("input");
    			t32 = space();
    			td17 = element("td");
    			t33 = space();
    			tr7 = element("tr");
    			td18 = element("td");
    			td18.textContent = "냉매 보충";
    			t35 = space();
    			td19 = element("td");
    			div8 = element("div");
    			input8 = element("input");
    			t36 = space();
    			td20 = element("td");
    			t37 = space();
    			tr8 = element("tr");
    			td21 = element("td");
    			td21.textContent = "드레인 펌프";
    			t39 = space();
    			td22 = element("td");
    			div9 = element("div");
    			input9 = element("input");
    			t40 = space();
    			td23 = element("td");
    			div10 = element("div");
    			input10 = element("input");
    			t41 = space();
    			span2 = element("span");
    			span2.textContent = "m";
    			t43 = space();
    			tr9 = element("tr");
    			td24 = element("td");
    			td24.textContent = "추가 타공";
    			t45 = space();
    			td25 = element("td");
    			div11 = element("div");
    			input11 = element("input");
    			t46 = space();
    			td26 = element("td");
    			div12 = element("div");
    			input12 = element("input");
    			t47 = space();
    			span3 = element("span");
    			span3.textContent = "m";
    			t49 = space();
    			tr10 = element("tr");
    			td27 = element("td");
    			td27.textContent = "실외기 설치 위험수당";
    			t51 = space();
    			td28 = element("td");
    			div13 = element("div");
    			input13 = element("input");
    			t52 = space();
    			td29 = element("td");
    			t53 = space();
    			tr11 = element("tr");
    			td30 = element("td");
    			td30.textContent = "드레인 키트";
    			t55 = space();
    			td31 = element("td");
    			div14 = element("div");
    			input14 = element("input");
    			t56 = space();
    			td32 = element("td");
    			t57 = space();
    			tr12 = element("tr");
    			td33 = element("td");
    			td33.textContent = "유니온";
    			t59 = space();
    			td34 = element("td");
    			div15 = element("div");
    			input15 = element("input");
    			t60 = space();
    			td35 = element("td");
    			t61 = space();
    			tr13 = element("tr");
    			td36 = element("td");
    			td36.textContent = "전원선 연장";
    			t63 = space();
    			td37 = element("td");
    			div16 = element("div");
    			input16 = element("input");
    			t64 = space();
    			td38 = element("td");
    			t65 = space();
    			tr14 = element("tr");
    			td39 = element("td");
    			td39.textContent = "에어 가이드";
    			t67 = space();
    			td40 = element("td");
    			div17 = element("div");
    			input17 = element("input");
    			t68 = space();
    			td41 = element("td");
    			t69 = space();
    			div22 = element("div");
    			div19 = element("div");
    			div18 = element("div");
    			span4 = element("span");
    			span4.textContent = "최소";
    			t71 = space();
    			input18 = element("input");
    			t72 = space();
    			div21 = element("div");
    			div20 = element("div");
    			span5 = element("span");
    			span5.textContent = "최대";
    			t74 = space();
    			input19 = element("input");
    			t75 = space();
    			div24 = element("div");
    			div23 = element("div");
    			div23.textContent = "완료된 견적입니다.";
    			add_location(th0, file$g, 238, 16, 7099);
    			add_location(th1, file$g, 239, 16, 7127);
    			attr_dev(th2, "class", "w-25");
    			add_location(th2, file$g, 240, 16, 7155);
    			add_location(tr0, file$g, 237, 14, 7078);
    			add_location(thead, file$g, 236, 12, 7056);
    			add_location(td0, file$g, 245, 16, 7276);
    			attr_dev(input0, "class", "form-check-input");
    			attr_dev(input0, "type", "checkbox");
    			input0.disabled = input0_disabled_value = !/*modify*/ ctx[5];
    			add_location(input0, file$g, 248, 20, 7401);
    			attr_dev(div0, "class", "form-check d-flex justify-content-start");
    			add_location(div0, file$g, 247, 18, 7327);
    			add_location(td1, file$g, 246, 16, 7304);
    			add_location(td2, file$g, 256, 16, 7674);
    			add_location(tr1, file$g, 244, 14, 7255);
    			add_location(td3, file$g, 260, 16, 7737);
    			attr_dev(input1, "class", "form-check-input");
    			attr_dev(input1, "type", "checkbox");
    			input1.disabled = input1_disabled_value = !/*modify*/ ctx[5];
    			add_location(input1, file$g, 263, 20, 7866);
    			attr_dev(div1, "class", "form-check d-flex justify-content-start");
    			add_location(div1, file$g, 262, 19, 7792);
    			add_location(td4, file$g, 261, 16, 7769);
    			add_location(td5, file$g, 271, 16, 8139);
    			add_location(tr2, file$g, 259, 14, 7716);
    			add_location(td6, file$g, 275, 16, 8202);
    			attr_dev(input2, "class", "form-check-input");
    			attr_dev(input2, "type", "checkbox");
    			input2.disabled = input2_disabled_value = !/*modify*/ ctx[5];
    			add_location(input2, file$g, 278, 20, 8336);
    			attr_dev(div2, "class", "form-check d-flex justify-content-start");
    			add_location(div2, file$g, 277, 18, 8262);
    			add_location(td7, file$g, 276, 16, 8239);
    			add_location(td8, file$g, 286, 16, 8610);
    			add_location(tr3, file$g, 274, 14, 8181);
    			add_location(td9, file$g, 290, 16, 8673);
    			attr_dev(input3, "class", "form-check-input");
    			attr_dev(input3, "type", "checkbox");
    			input3.disabled = input3_disabled_value = !/*modify*/ ctx[5];
    			add_location(input3, file$g, 293, 20, 8801);
    			attr_dev(div3, "class", "form-check d-flex justify-content-start");
    			add_location(div3, file$g, 292, 19, 8727);
    			add_location(td10, file$g, 291, 16, 8704);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "class", "form-control w-50 svelte-kwefzz");
    			attr_dev(input4, "placeholder", "필요 길이");
    			attr_dev(input4, "aria-label", "필요 길이");
    			input4.disabled = input4_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].pipe_extend);
    			add_location(input4, file$g, 303, 20, 9164);
    			attr_dev(span0, "class", "input-group-text");
    			add_location(span0, file$g, 311, 20, 9515);
    			attr_dev(div4, "class", "input-group input-group-sm");
    			add_location(div4, file$g, 302, 18, 9103);
    			add_location(td11, file$g, 301, 16, 9080);
    			add_location(tr4, file$g, 289, 14, 8652);
    			add_location(td12, file$g, 317, 16, 9660);
    			attr_dev(input5, "class", "form-check-input");
    			attr_dev(input5, "type", "checkbox");
    			input5.disabled = input5_disabled_value = !/*modify*/ ctx[5];
    			add_location(input5, file$g, 320, 20, 9788);
    			attr_dev(div5, "class", "form-check d-flex justify-content-start");
    			add_location(div5, file$g, 319, 19, 9714);
    			add_location(td13, file$g, 318, 16, 9691);
    			attr_dev(input6, "type", "number");
    			attr_dev(input6, "class", "form-control w-50 svelte-kwefzz");
    			attr_dev(input6, "placeholder", "필요 길이");
    			attr_dev(input6, "aria-label", "필요 길이");
    			input6.disabled = input6_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].wrinkle);
    			add_location(input6, file$g, 330, 20, 10147);
    			attr_dev(span1, "class", "input-group-text");
    			add_location(span1, file$g, 338, 20, 10490);
    			attr_dev(div6, "class", "input-group input-group-sm");
    			add_location(div6, file$g, 329, 18, 10086);
    			add_location(td14, file$g, 328, 16, 10063);
    			add_location(tr5, file$g, 316, 14, 9639);
    			add_location(td15, file$g, 344, 16, 10635);
    			attr_dev(input7, "class", "form-check-input");
    			attr_dev(input7, "type", "checkbox");
    			input7.disabled = input7_disabled_value = !/*modify*/ ctx[5];
    			add_location(input7, file$g, 347, 20, 10763);
    			attr_dev(div7, "class", "form-check d-flex justify-content-start");
    			add_location(div7, file$g, 346, 18, 10689);
    			add_location(td16, file$g, 345, 16, 10666);
    			add_location(td17, file$g, 355, 16, 11038);
    			add_location(tr6, file$g, 343, 14, 10614);
    			add_location(td18, file$g, 359, 16, 11101);
    			attr_dev(input8, "class", "form-check-input");
    			attr_dev(input8, "type", "checkbox");
    			input8.disabled = input8_disabled_value = !/*modify*/ ctx[5];
    			add_location(input8, file$g, 362, 20, 11229);
    			attr_dev(div8, "class", "form-check d-flex justify-content-start");
    			add_location(div8, file$g, 361, 18, 11155);
    			add_location(td19, file$g, 360, 16, 11132);
    			add_location(td20, file$g, 370, 16, 11500);
    			add_location(tr7, file$g, 358, 14, 11080);
    			add_location(td21, file$g, 374, 16, 11563);
    			attr_dev(input9, "class", "form-check-input");
    			attr_dev(input9, "type", "checkbox");
    			input9.disabled = input9_disabled_value = !/*modify*/ ctx[5];
    			add_location(input9, file$g, 377, 20, 11692);
    			attr_dev(div9, "class", "form-check d-flex justify-content-start");
    			add_location(div9, file$g, 376, 19, 11618);
    			add_location(td22, file$g, 375, 16, 11595);
    			attr_dev(input10, "type", "number");
    			attr_dev(input10, "class", "form-control w-50 svelte-kwefzz");
    			attr_dev(input10, "placeholder", "필요 길이");
    			attr_dev(input10, "aria-label", "필요 길이");
    			input10.disabled = input10_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].drain_pump);
    			add_location(input10, file$g, 387, 20, 12054);
    			attr_dev(span2, "class", "input-group-text");
    			add_location(span2, file$g, 395, 20, 12403);
    			attr_dev(div10, "class", "input-group input-group-sm");
    			add_location(div10, file$g, 386, 18, 11993);
    			add_location(td23, file$g, 385, 16, 11970);
    			add_location(tr8, file$g, 373, 14, 11542);
    			add_location(td24, file$g, 401, 16, 12548);
    			attr_dev(input11, "class", "form-check-input");
    			attr_dev(input11, "type", "checkbox");
    			input11.disabled = input11_disabled_value = !/*modify*/ ctx[5];
    			add_location(input11, file$g, 404, 20, 12676);
    			attr_dev(div11, "class", "form-check d-flex justify-content-start");
    			add_location(div11, file$g, 403, 19, 12602);
    			add_location(td25, file$g, 402, 16, 12579);
    			attr_dev(input12, "type", "number");
    			attr_dev(input12, "class", "form-control w-50 svelte-kwefzz");
    			attr_dev(input12, "placeholder", "타공 횟수");
    			attr_dev(input12, "aria-label", "타공 횟수");
    			input12.disabled = input12_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].hole);
    			add_location(input12, file$g, 414, 20, 13032);
    			attr_dev(span3, "class", "input-group-text");
    			add_location(span3, file$g, 422, 20, 13369);
    			attr_dev(div12, "class", "input-group input-group-sm");
    			add_location(div12, file$g, 413, 18, 12971);
    			add_location(td26, file$g, 412, 16, 12948);
    			add_location(tr9, file$g, 400, 14, 12527);
    			add_location(td27, file$g, 428, 16, 13514);
    			attr_dev(input13, "class", "form-check-input");
    			attr_dev(input13, "type", "checkbox");
    			input13.disabled = input13_disabled_value = !/*modify*/ ctx[5];
    			add_location(input13, file$g, 431, 20, 13648);
    			attr_dev(div13, "class", "form-check d-flex justify-content-start");
    			add_location(div13, file$g, 430, 18, 13574);
    			add_location(td28, file$g, 429, 16, 13551);
    			add_location(td29, file$g, 439, 16, 13926);
    			add_location(tr10, file$g, 427, 14, 13493);
    			add_location(td30, file$g, 443, 16, 13989);
    			attr_dev(input14, "class", "form-check-input");
    			attr_dev(input14, "type", "checkbox");
    			input14.disabled = input14_disabled_value = !/*modify*/ ctx[5];
    			add_location(input14, file$g, 446, 20, 14118);
    			attr_dev(div14, "class", "form-check d-flex justify-content-start");
    			add_location(div14, file$g, 445, 18, 14044);
    			add_location(td31, file$g, 444, 16, 14021);
    			add_location(td32, file$g, 454, 16, 14395);
    			add_location(tr11, file$g, 442, 14, 13968);
    			add_location(td33, file$g, 458, 16, 14458);
    			attr_dev(input15, "class", "form-check-input");
    			attr_dev(input15, "type", "checkbox");
    			input15.disabled = input15_disabled_value = !/*modify*/ ctx[5];
    			add_location(input15, file$g, 461, 20, 14584);
    			attr_dev(div15, "class", "form-check d-flex justify-content-start");
    			add_location(div15, file$g, 460, 18, 14510);
    			add_location(td34, file$g, 459, 16, 14487);
    			add_location(td35, file$g, 469, 16, 14861);
    			add_location(tr12, file$g, 457, 14, 14437);
    			add_location(td36, file$g, 473, 16, 14924);
    			attr_dev(input16, "class", "form-check-input");
    			attr_dev(input16, "type", "checkbox");
    			input16.disabled = input16_disabled_value = !/*modify*/ ctx[5];
    			add_location(input16, file$g, 476, 20, 15053);
    			attr_dev(div16, "class", "form-check d-flex justify-content-start");
    			add_location(div16, file$g, 475, 18, 14979);
    			add_location(td37, file$g, 474, 16, 14956);
    			add_location(td38, file$g, 484, 16, 15331);
    			add_location(tr13, file$g, 472, 14, 14903);
    			add_location(td39, file$g, 488, 16, 15394);
    			attr_dev(input17, "class", "form-check-input");
    			attr_dev(input17, "type", "checkbox");
    			input17.disabled = input17_disabled_value = !/*modify*/ ctx[5];
    			add_location(input17, file$g, 491, 20, 15523);
    			attr_dev(div17, "class", "form-check d-flex justify-content-start");
    			add_location(div17, file$g, 490, 18, 15449);
    			add_location(td40, file$g, 489, 16, 15426);
    			add_location(td41, file$g, 499, 16, 15800);
    			add_location(tr14, file$g, 487, 14, 15373);
    			add_location(tbody, file$g, 243, 12, 7233);
    			attr_dev(table, "class", "table table-sm");
    			add_location(table, file$g, 235, 10, 7013);
    			attr_dev(span4, "class", "input-group-text");
    			attr_dev(span4, "id", "inputGroup-sizing-default");
    			add_location(span4, file$g, 506, 16, 16019);
    			attr_dev(input18, "type", "number");
    			attr_dev(input18, "class", "form-control w-50 svelte-kwefzz");
    			attr_dev(input18, "placeholder", "금액 입력");
    			attr_dev(input18, "aria-label", "금액 입력");
    			input18.disabled = true;
    			add_location(input18, file$g, 509, 16, 16143);
    			attr_dev(div18, "class", "input-group input-group-lg");
    			add_location(div18, file$g, 505, 14, 15962);
    			attr_dev(div19, "class", "p-1");
    			add_location(div19, file$g, 504, 12, 15930);
    			attr_dev(span5, "class", "input-group-text");
    			attr_dev(span5, "id", "inputGroup-sizing-default");
    			add_location(span5, file$g, 521, 16, 16540);
    			attr_dev(input19, "type", "number");
    			attr_dev(input19, "class", "form-control w-50 svelte-kwefzz");
    			attr_dev(input19, "placeholder", "금액 입력");
    			attr_dev(input19, "aria-label", "금액 입력");
    			input19.disabled = true;
    			add_location(input19, file$g, 524, 16, 16664);
    			attr_dev(div20, "class", "input-group input-group-lg");
    			add_location(div20, file$g, 520, 14, 16483);
    			attr_dev(div21, "class", "p-1");
    			add_location(div21, file$g, 519, 12, 16451);
    			attr_dev(div22, "class", "d-flex justify-content-end");
    			add_location(div22, file$g, 503, 10, 15877);
    			attr_dev(div23, "class", "col text-center");
    			add_location(div23, file$g, 536, 12, 17028);
    			attr_dev(div24, "class", "row pt-4 pb-2");
    			add_location(div24, file$g, 535, 10, 16988);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t1);
    			append_dev(tr0, th1);
    			append_dev(tr0, t3);
    			append_dev(tr0, th2);
    			append_dev(table, t5);
    			append_dev(table, tbody);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t7);
    			append_dev(tr1, td1);
    			append_dev(td1, div0);
    			append_dev(div0, input0);
    			input0.checked = /*resultData*/ ctx[0].angle;
    			append_dev(tr1, t8);
    			append_dev(tr1, td2);
    			append_dev(tbody, t9);
    			append_dev(tbody, tr2);
    			append_dev(tr2, td3);
    			append_dev(tr2, t11);
    			append_dev(tr2, td4);
    			append_dev(td4, div1);
    			append_dev(div1, input1);
    			input1.checked = /*resultData*/ ctx[0].stand;
    			append_dev(tr2, t12);
    			append_dev(tr2, td5);
    			append_dev(tbody, t13);
    			append_dev(tbody, tr3);
    			append_dev(tr3, td6);
    			append_dev(tr3, t15);
    			append_dev(tr3, td7);
    			append_dev(td7, div2);
    			append_dev(div2, input2);
    			input2.checked = /*resultData*/ ctx[0].holder;
    			append_dev(tr3, t16);
    			append_dev(tr3, td8);
    			append_dev(tbody, t17);
    			append_dev(tbody, tr4);
    			append_dev(tr4, td9);
    			append_dev(tr4, t19);
    			append_dev(tr4, td10);
    			append_dev(td10, div3);
    			append_dev(div3, input3);
    			input3.checked = /*resultData*/ ctx[0].pipe_extend;
    			append_dev(tr4, t20);
    			append_dev(tr4, td11);
    			append_dev(td11, div4);
    			append_dev(div4, input4);
    			set_input_value(input4, /*resultData*/ ctx[0].pipe_extend_length);
    			append_dev(div4, t21);
    			append_dev(div4, span0);
    			append_dev(tbody, t23);
    			append_dev(tbody, tr5);
    			append_dev(tr5, td12);
    			append_dev(tr5, t25);
    			append_dev(tr5, td13);
    			append_dev(td13, div5);
    			append_dev(div5, input5);
    			input5.checked = /*resultData*/ ctx[0].wrinkle;
    			append_dev(tr5, t26);
    			append_dev(tr5, td14);
    			append_dev(td14, div6);
    			append_dev(div6, input6);
    			set_input_value(input6, /*resultData*/ ctx[0].wrinkle_length);
    			append_dev(div6, t27);
    			append_dev(div6, span1);
    			append_dev(tbody, t29);
    			append_dev(tbody, tr6);
    			append_dev(tr6, td15);
    			append_dev(tr6, t31);
    			append_dev(tr6, td16);
    			append_dev(td16, div7);
    			append_dev(div7, input7);
    			input7.checked = /*resultData*/ ctx[0].welding;
    			append_dev(tr6, t32);
    			append_dev(tr6, td17);
    			append_dev(tbody, t33);
    			append_dev(tbody, tr7);
    			append_dev(tr7, td18);
    			append_dev(tr7, t35);
    			append_dev(tr7, td19);
    			append_dev(td19, div8);
    			append_dev(div8, input8);
    			input8.checked = /*resultData*/ ctx[0].gas;
    			append_dev(tr7, t36);
    			append_dev(tr7, td20);
    			append_dev(tbody, t37);
    			append_dev(tbody, tr8);
    			append_dev(tr8, td21);
    			append_dev(tr8, t39);
    			append_dev(tr8, td22);
    			append_dev(td22, div9);
    			append_dev(div9, input9);
    			input9.checked = /*resultData*/ ctx[0].drain_pump;
    			append_dev(tr8, t40);
    			append_dev(tr8, td23);
    			append_dev(td23, div10);
    			append_dev(div10, input10);
    			set_input_value(input10, /*resultData*/ ctx[0].drain_pump_length);
    			append_dev(div10, t41);
    			append_dev(div10, span2);
    			append_dev(tbody, t43);
    			append_dev(tbody, tr9);
    			append_dev(tr9, td24);
    			append_dev(tr9, t45);
    			append_dev(tr9, td25);
    			append_dev(td25, div11);
    			append_dev(div11, input11);
    			input11.checked = /*resultData*/ ctx[0].hole;
    			append_dev(tr9, t46);
    			append_dev(tr9, td26);
    			append_dev(td26, div12);
    			append_dev(div12, input12);
    			set_input_value(input12, /*resultData*/ ctx[0].hole_amount);
    			append_dev(div12, t47);
    			append_dev(div12, span3);
    			append_dev(tbody, t49);
    			append_dev(tbody, tr10);
    			append_dev(tr10, td27);
    			append_dev(tr10, t51);
    			append_dev(tr10, td28);
    			append_dev(td28, div13);
    			append_dev(div13, input13);
    			input13.checked = /*resultData*/ ctx[0].danger_fee;
    			append_dev(tr10, t52);
    			append_dev(tr10, td29);
    			append_dev(tbody, t53);
    			append_dev(tbody, tr11);
    			append_dev(tr11, td30);
    			append_dev(tr11, t55);
    			append_dev(tr11, td31);
    			append_dev(td31, div14);
    			append_dev(div14, input14);
    			input14.checked = /*resultData*/ ctx[0].drain_kit;
    			append_dev(tr11, t56);
    			append_dev(tr11, td32);
    			append_dev(tbody, t57);
    			append_dev(tbody, tr12);
    			append_dev(tr12, td33);
    			append_dev(tr12, t59);
    			append_dev(tr12, td34);
    			append_dev(td34, div15);
    			append_dev(div15, input15);
    			input15.checked = /*resultData*/ ctx[0].union_kit;
    			append_dev(tr12, t60);
    			append_dev(tr12, td35);
    			append_dev(tbody, t61);
    			append_dev(tbody, tr13);
    			append_dev(tr13, td36);
    			append_dev(tr13, t63);
    			append_dev(tr13, td37);
    			append_dev(td37, div16);
    			append_dev(div16, input16);
    			input16.checked = /*resultData*/ ctx[0].power_line;
    			append_dev(tr13, t64);
    			append_dev(tr13, td38);
    			append_dev(tbody, t65);
    			append_dev(tbody, tr14);
    			append_dev(tr14, td39);
    			append_dev(tr14, t67);
    			append_dev(tr14, td40);
    			append_dev(td40, div17);
    			append_dev(div17, input17);
    			input17.checked = /*resultData*/ ctx[0].air_guide;
    			append_dev(tr14, t68);
    			append_dev(tr14, td41);
    			insert_dev(target, t69, anchor);
    			insert_dev(target, div22, anchor);
    			append_dev(div22, div19);
    			append_dev(div19, div18);
    			append_dev(div18, span4);
    			append_dev(div18, t71);
    			append_dev(div18, input18);
    			set_input_value(input18, /*resultData*/ ctx[0].price_low);
    			append_dev(div22, t72);
    			append_dev(div22, div21);
    			append_dev(div21, div20);
    			append_dev(div20, span5);
    			append_dev(div20, t74);
    			append_dev(div20, input19);
    			set_input_value(input19, /*resultData*/ ctx[0].price_high);
    			insert_dev(target, t75, anchor);
    			insert_dev(target, div24, anchor);
    			append_dev(div24, div23);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[17]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[18]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[19]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[20]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[21]),
    					listen_dev(input5, "change", /*input5_change_handler*/ ctx[22]),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[23]),
    					listen_dev(input7, "change", /*input7_change_handler*/ ctx[24]),
    					listen_dev(input8, "change", /*input8_change_handler*/ ctx[25]),
    					listen_dev(input9, "change", /*input9_change_handler*/ ctx[26]),
    					listen_dev(input10, "input", /*input10_input_handler*/ ctx[27]),
    					listen_dev(input11, "change", /*input11_change_handler*/ ctx[28]),
    					listen_dev(input12, "input", /*input12_input_handler*/ ctx[29]),
    					listen_dev(input13, "change", /*input13_change_handler*/ ctx[30]),
    					listen_dev(input14, "change", /*input14_change_handler*/ ctx[31]),
    					listen_dev(input15, "change", /*input15_change_handler*/ ctx[32]),
    					listen_dev(input16, "change", /*input16_change_handler*/ ctx[33]),
    					listen_dev(input17, "change", /*input17_change_handler*/ ctx[34]),
    					listen_dev(input18, "input", /*input18_input_handler*/ ctx[35]),
    					listen_dev(input19, "input", /*input19_input_handler*/ ctx[36])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*modify*/ 32 && input0_disabled_value !== (input0_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input0, "disabled", input0_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input0.checked = /*resultData*/ ctx[0].angle;
    			}

    			if (dirty[0] & /*modify*/ 32 && input1_disabled_value !== (input1_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input1, "disabled", input1_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input1.checked = /*resultData*/ ctx[0].stand;
    			}

    			if (dirty[0] & /*modify*/ 32 && input2_disabled_value !== (input2_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input2, "disabled", input2_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input2.checked = /*resultData*/ ctx[0].holder;
    			}

    			if (dirty[0] & /*modify*/ 32 && input3_disabled_value !== (input3_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input3, "disabled", input3_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input3.checked = /*resultData*/ ctx[0].pipe_extend;
    			}

    			if (dirty[0] & /*modify, resultData*/ 33 && input4_disabled_value !== (input4_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].pipe_extend))) {
    				prop_dev(input4, "disabled", input4_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1 && to_number(input4.value) !== /*resultData*/ ctx[0].pipe_extend_length) {
    				set_input_value(input4, /*resultData*/ ctx[0].pipe_extend_length);
    			}

    			if (dirty[0] & /*modify*/ 32 && input5_disabled_value !== (input5_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input5, "disabled", input5_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input5.checked = /*resultData*/ ctx[0].wrinkle;
    			}

    			if (dirty[0] & /*modify, resultData*/ 33 && input6_disabled_value !== (input6_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].wrinkle))) {
    				prop_dev(input6, "disabled", input6_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1 && to_number(input6.value) !== /*resultData*/ ctx[0].wrinkle_length) {
    				set_input_value(input6, /*resultData*/ ctx[0].wrinkle_length);
    			}

    			if (dirty[0] & /*modify*/ 32 && input7_disabled_value !== (input7_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input7, "disabled", input7_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input7.checked = /*resultData*/ ctx[0].welding;
    			}

    			if (dirty[0] & /*modify*/ 32 && input8_disabled_value !== (input8_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input8, "disabled", input8_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input8.checked = /*resultData*/ ctx[0].gas;
    			}

    			if (dirty[0] & /*modify*/ 32 && input9_disabled_value !== (input9_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input9, "disabled", input9_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input9.checked = /*resultData*/ ctx[0].drain_pump;
    			}

    			if (dirty[0] & /*modify, resultData*/ 33 && input10_disabled_value !== (input10_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].drain_pump))) {
    				prop_dev(input10, "disabled", input10_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1 && to_number(input10.value) !== /*resultData*/ ctx[0].drain_pump_length) {
    				set_input_value(input10, /*resultData*/ ctx[0].drain_pump_length);
    			}

    			if (dirty[0] & /*modify*/ 32 && input11_disabled_value !== (input11_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input11, "disabled", input11_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input11.checked = /*resultData*/ ctx[0].hole;
    			}

    			if (dirty[0] & /*modify, resultData*/ 33 && input12_disabled_value !== (input12_disabled_value = !(/*modify*/ ctx[5] && /*resultData*/ ctx[0].hole))) {
    				prop_dev(input12, "disabled", input12_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1 && to_number(input12.value) !== /*resultData*/ ctx[0].hole_amount) {
    				set_input_value(input12, /*resultData*/ ctx[0].hole_amount);
    			}

    			if (dirty[0] & /*modify*/ 32 && input13_disabled_value !== (input13_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input13, "disabled", input13_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input13.checked = /*resultData*/ ctx[0].danger_fee;
    			}

    			if (dirty[0] & /*modify*/ 32 && input14_disabled_value !== (input14_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input14, "disabled", input14_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input14.checked = /*resultData*/ ctx[0].drain_kit;
    			}

    			if (dirty[0] & /*modify*/ 32 && input15_disabled_value !== (input15_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input15, "disabled", input15_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input15.checked = /*resultData*/ ctx[0].union_kit;
    			}

    			if (dirty[0] & /*modify*/ 32 && input16_disabled_value !== (input16_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input16, "disabled", input16_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input16.checked = /*resultData*/ ctx[0].power_line;
    			}

    			if (dirty[0] & /*modify*/ 32 && input17_disabled_value !== (input17_disabled_value = !/*modify*/ ctx[5])) {
    				prop_dev(input17, "disabled", input17_disabled_value);
    			}

    			if (dirty[0] & /*resultData*/ 1) {
    				input17.checked = /*resultData*/ ctx[0].air_guide;
    			}

    			if (dirty[0] & /*resultData*/ 1 && to_number(input18.value) !== /*resultData*/ ctx[0].price_low) {
    				set_input_value(input18, /*resultData*/ ctx[0].price_low);
    			}

    			if (dirty[0] & /*resultData*/ 1 && to_number(input19.value) !== /*resultData*/ ctx[0].price_high) {
    				set_input_value(input19, /*resultData*/ ctx[0].price_high);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			if (detaching) detach_dev(t69);
    			if (detaching) detach_dev(div22);
    			if (detaching) detach_dev(t75);
    			if (detaching) detach_dev(div24);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(235:30) ",
    		ctx
    	});

    	return block;
    }

    // (226:8) {#if submitted}
    function create_if_block$5(ctx) {
    	let div0;
    	let h3;
    	let t1;
    	let div1;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "요청 완료";
    			t1 = space();
    			div1 = element("div");
    			button = element("button");
    			button.textContent = "돌아가기";
    			attr_dev(h3, "class", "my-5 text-center");
    			add_location(h3, file$g, 227, 12, 6726);
    			attr_dev(div0, "class", "row d-flex justify-content-center");
    			add_location(div0, file$g, 226, 10, 6666);
    			attr_dev(button, "class", "btn btn-lg btn-light");
    			add_location(button, file$g, 230, 12, 6853);
    			attr_dev(div1, "class", "row d-flex justify-content-center");
    			add_location(div1, file$g, 229, 10, 6793);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h3);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[16], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(226:8) {#if submitted}",
    		ctx
    	});

    	return block;
    }

    // (1520:14) {#if showAlert}
    function create_if_block_6(ctx) {
    	let tr;
    	let td;
    	let alert;
    	let updating_showAlert;
    	let updating_message;
    	let current;

    	function alert_showAlert_binding_1(value) {
    		/*alert_showAlert_binding_1*/ ctx[102](value);
    	}

    	function alert_message_binding_1(value) {
    		/*alert_message_binding_1*/ ctx[103](value);
    	}

    	let alert_props = {};

    	if (/*showAlert*/ ctx[2] !== void 0) {
    		alert_props.showAlert = /*showAlert*/ ctx[2];
    	}

    	if (/*message*/ ctx[3] !== void 0) {
    		alert_props.message = /*message*/ ctx[3];
    	}

    	alert = new Alert({ props: alert_props, $$inline: true });
    	binding_callbacks.push(() => bind(alert, "showAlert", alert_showAlert_binding_1));
    	binding_callbacks.push(() => bind(alert, "message", alert_message_binding_1));

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			create_component(alert.$$.fragment);
    			attr_dev(td, "colspan", "2");
    			add_location(td, file$g, 1521, 18, 49722);
    			add_location(tr, file$g, 1520, 16, 49699);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			mount_component(alert, td, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const alert_changes = {};

    			if (!updating_showAlert && dirty[0] & /*showAlert*/ 4) {
    				updating_showAlert = true;
    				alert_changes.showAlert = /*showAlert*/ ctx[2];
    				add_flush_callback(() => updating_showAlert = false);
    			}

    			if (!updating_message && dirty[0] & /*message*/ 8) {
    				updating_message = true;
    				alert_changes.message = /*message*/ ctx[3];
    				add_flush_callback(() => updating_message = false);
    			}

    			alert.$set(alert_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(alert.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(alert.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_component(alert);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(1520:14) {#if showAlert}",
    		ctx
    	});

    	return block;
    }

    // (868:64) {:else}
    function create_else_block$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("OFF");
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
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(868:64) {:else}",
    		ctx
    	});

    	return block;
    }

    // (868:50) {#if modify}
    function create_if_block_4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("ON");
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(868:50) {#if modify}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$n(ctx) {
    	let main;
    	let t0;
    	let div3;
    	let div0;
    	let button;
    	let i;
    	let t1;
    	let t2;
    	let div2;
    	let div1;
    	let h4;
    	let span;
    	let t3_value = /*statusString*/ ctx[7][/*status*/ ctx[1]] + "";
    	let t3;
    	let span_class_value;
    	let t4;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$2,
    		then: create_then_block$2,
    		catch: create_catch_block$2,
    		value: 109
    	};

    	handle_promise(/*getData*/ ctx[10], info);

    	const if_block_creators = [
    		create_if_block$5,
    		create_if_block_1$1,
    		create_if_block_2$1,
    		create_if_block_3$1,
    		create_if_block_5
    	];

    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*submitted*/ ctx[6]) return 0;
    		if (/*status*/ ctx[1] == 3) return 1;
    		if (/*status*/ ctx[1] == 2) return 2;
    		if (/*status*/ ctx[1] == 1) return 3;
    		if (/*status*/ ctx[1] == 0) return 4;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_1(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			info.block.c();
    			t0 = space();
    			div3 = element("div");
    			div0 = element("div");
    			button = element("button");
    			i = element("i");
    			t1 = text(" 뒤로가기");
    			t2 = space();
    			div2 = element("div");
    			div1 = element("div");
    			h4 = element("h4");
    			span = element("span");
    			t3 = text(t3_value);
    			t4 = space();
    			if (if_block) if_block.c();
    			attr_dev(i, "class", "fas fa-chevron-left");
    			add_location(i, file$g, 214, 9, 6356);
    			attr_dev(button, "class", "btn btn-light btn-lg btn-rounded");
    			add_location(button, file$g, 213, 6, 6275);
    			attr_dev(div0, "class", "d-flex py-3");
    			add_location(div0, file$g, 212, 4, 6243);
    			attr_dev(span, "class", span_class_value = "badge " + /*statusColor*/ ctx[8][/*status*/ ctx[1]] + " svelte-kwefzz");
    			add_location(span, file$g, 221, 10, 6522);
    			attr_dev(h4, "class", "text-end");
    			add_location(h4, file$g, 220, 8, 6490);
    			attr_dev(div1, "class", "card-body ");
    			add_location(div1, file$g, 219, 6, 6457);
    			attr_dev(div2, "class", "card mb-5");
    			add_location(div2, file$g, 218, 4, 6427);
    			attr_dev(div3, "class", "container pt-2");
    			add_location(div3, file$g, 211, 2, 6210);
    			attr_dev(main, "class", "svelte-kwefzz");
    			add_location(main, file$g, 109, 0, 2851);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = t0;
    			append_dev(main, t0);
    			append_dev(main, div3);
    			append_dev(div3, div0);
    			append_dev(div0, button);
    			append_dev(button, i);
    			append_dev(button, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, h4);
    			append_dev(h4, span);
    			append_dev(span, t3);
    			append_dev(div1, t4);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[15], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    			if ((!current || dirty[0] & /*status*/ 2) && t3_value !== (t3_value = /*statusString*/ ctx[7][/*status*/ ctx[1]] + "")) set_data_dev(t3, t3_value);

    			if (!current || dirty[0] & /*status*/ 2 && span_class_value !== (span_class_value = "badge " + /*statusColor*/ ctx[8][/*status*/ ctx[1]] + " svelte-kwefzz")) {
    				attr_dev(span, "class", span_class_value);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
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
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(div1, null);
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
    			if (detaching) detach_dev(main);
    			info.block.d();
    			info.token = null;
    			info = null;

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Viewer", slots, []);
    	const statusString = ["신규의뢰", "견적완료", "확인완료", "답변완료"];
    	const statusColor = ["bg-warning", "bg-info", "bg-primary", "bg-success"];
    	var resultData = {};
    	var status;

    	onMount(async () => {
    		let res = await getStatus(requestNo);
    		$$invalidate(1, status = res.data.request_status);

    		if (status != 0) {
    			let res = await getResult(requestNo);
    			$$invalidate(0, resultData = res.data);
    		}
    	});

    	let { params = {} } = $$props;
    	const requestNo = params.request_no;
    	const getData = getRequest(requestNo);
    	let showAlert = false;
    	let message = "";

    	var formData = {
    		request_no: params.request_no,
    		angle: false,
    		stand: false,
    		holder: false,
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
    		union_kit: false,
    		power_line: false,
    		air_guide: false,
    		comment: undefined
    	};

    	const validateValues = () => {
    		if (formData.pipe_extend && formData.pipe_extend_length == undefined) return false; else if (formData.wrinkle && formData.wrinkle_length == undefined) return false; else if (formData.drain_pump && formData.drain_pump_length == undefined) return false; else if (formData.hole && formData.hole_amount == undefined) return false; else return true;
    	};

    	const changeStatus = status => {
    		var payload = {
    			request_no: requestNo,
    			request_status: status
    		};

    		setStatus(JSON.stringify(payload));
    		$$invalidate(6, submitted = true);
    	};

    	const validatePrice = () => {
    		if (resultData.price_low <= 0 || resultData.price_low == undefined) return false; else if (resultData.price_high <= 0 || resultData.price_high == undefined) return false; else return true;
    	};

    	var modify = false;
    	var submitted = false;
    	var insertResultData;

    	const handleSubmit = () => {
    		if (validateValues()) {
    			$$invalidate(6, submitted = true);
    			insertResultData = insertResult(JSON.stringify(formData)).success;
    		} else {
    			$$invalidate(2, showAlert = true);
    			$$invalidate(3, message = "입력되지 않은 값이 있습니다.");
    		}
    	};

    	var updateResultData;

    	const handleUpdate = () => {
    		if (validatePrice()) {
    			$$invalidate(6, submitted = true);
    			updateResultData = updateResult(JSON.stringify(resultData)).success;
    		} else {
    			$$invalidate(2, showAlert = true);
    			$$invalidate(3, message = "가격이 입력되지 않았습니다.");
    		}
    	};

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Viewer> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => pop();
    	const click_handler_1 = () => pop();

    	function input0_change_handler() {
    		resultData.angle = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input1_change_handler() {
    		resultData.stand = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input2_change_handler() {
    		resultData.holder = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input3_change_handler() {
    		resultData.pipe_extend = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input4_input_handler() {
    		resultData.pipe_extend_length = to_number(this.value);
    		$$invalidate(0, resultData);
    	}

    	function input5_change_handler() {
    		resultData.wrinkle = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input6_input_handler() {
    		resultData.wrinkle_length = to_number(this.value);
    		$$invalidate(0, resultData);
    	}

    	function input7_change_handler() {
    		resultData.welding = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input8_change_handler() {
    		resultData.gas = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input9_change_handler() {
    		resultData.drain_pump = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input10_input_handler() {
    		resultData.drain_pump_length = to_number(this.value);
    		$$invalidate(0, resultData);
    	}

    	function input11_change_handler() {
    		resultData.hole = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input12_input_handler() {
    		resultData.hole_amount = to_number(this.value);
    		$$invalidate(0, resultData);
    	}

    	function input13_change_handler() {
    		resultData.danger_fee = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input14_change_handler() {
    		resultData.drain_kit = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input15_change_handler() {
    		resultData.union_kit = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input16_change_handler() {
    		resultData.power_line = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input17_change_handler() {
    		resultData.air_guide = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input18_input_handler() {
    		resultData.price_low = to_number(this.value);
    		$$invalidate(0, resultData);
    	}

    	function input19_input_handler() {
    		resultData.price_high = to_number(this.value);
    		$$invalidate(0, resultData);
    	}

    	function input0_change_handler_1() {
    		resultData.angle = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input1_change_handler_1() {
    		resultData.stand = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input2_change_handler_1() {
    		resultData.holder = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input3_change_handler_1() {
    		resultData.pipe_extend = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input4_input_handler_1() {
    		resultData.pipe_extend_length = to_number(this.value);
    		$$invalidate(0, resultData);
    	}

    	function input5_change_handler_1() {
    		resultData.wrinkle = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input6_input_handler_1() {
    		resultData.wrinkle_length = to_number(this.value);
    		$$invalidate(0, resultData);
    	}

    	function input7_change_handler_1() {
    		resultData.welding = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input8_change_handler_1() {
    		resultData.gas = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input9_change_handler_1() {
    		resultData.drain_pump = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input10_input_handler_1() {
    		resultData.drain_pump_length = to_number(this.value);
    		$$invalidate(0, resultData);
    	}

    	function input11_change_handler_1() {
    		resultData.hole = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input12_input_handler_1() {
    		resultData.hole_amount = to_number(this.value);
    		$$invalidate(0, resultData);
    	}

    	function input13_change_handler_1() {
    		resultData.danger_fee = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input14_change_handler_1() {
    		resultData.drain_kit = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input15_change_handler_1() {
    		resultData.union_kit = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input16_change_handler_1() {
    		resultData.power_line = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input17_change_handler_1() {
    		resultData.air_guide = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input18_input_handler_1() {
    		resultData.price_low = to_number(this.value);
    		$$invalidate(0, resultData);
    	}

    	function input19_input_handler_1() {
    		resultData.price_high = to_number(this.value);
    		$$invalidate(0, resultData);
    	}

    	const click_handler_2 = () => changeStatus(1);
    	const click_handler_3 = () => changeStatus(3);

    	const click_handler_4 = () => {
    		$$invalidate(5, modify = !modify);
    	};

    	function input0_change_handler_2() {
    		resultData.angle = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input1_change_handler_2() {
    		resultData.stand = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input2_change_handler_2() {
    		resultData.holder = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input3_change_handler_2() {
    		resultData.pipe_extend = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input4_input_handler_2() {
    		resultData.pipe_extend_length = to_number(this.value);
    		$$invalidate(0, resultData);
    	}

    	function input5_change_handler_2() {
    		resultData.wrinkle = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input6_input_handler_2() {
    		resultData.wrinkle_length = to_number(this.value);
    		$$invalidate(0, resultData);
    	}

    	function input7_change_handler_2() {
    		resultData.welding = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input8_change_handler_2() {
    		resultData.gas = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input9_change_handler_2() {
    		resultData.drain_pump = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input10_input_handler_2() {
    		resultData.drain_pump_length = to_number(this.value);
    		$$invalidate(0, resultData);
    	}

    	function input11_change_handler_2() {
    		resultData.hole = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input12_input_handler_2() {
    		resultData.hole_amount = to_number(this.value);
    		$$invalidate(0, resultData);
    	}

    	function input13_change_handler_2() {
    		resultData.danger_fee = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input14_change_handler_2() {
    		resultData.drain_kit = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input15_change_handler_2() {
    		resultData.union_kit = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input16_change_handler_2() {
    		resultData.power_line = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function input17_change_handler_2() {
    		resultData.air_guide = this.checked;
    		$$invalidate(0, resultData);
    	}

    	function textarea_input_handler() {
    		resultData.comment = this.value;
    		$$invalidate(0, resultData);
    	}

    	function alert_showAlert_binding(value) {
    		showAlert = value;
    		$$invalidate(2, showAlert);
    	}

    	function alert_message_binding(value) {
    		message = value;
    		$$invalidate(3, message);
    	}

    	function input18_input_handler_2() {
    		resultData.price_low = to_number(this.value);
    		$$invalidate(0, resultData);
    	}

    	function input19_input_handler_2() {
    		resultData.price_high = to_number(this.value);
    		$$invalidate(0, resultData);
    	}

    	function input0_change_handler_3() {
    		formData.angle = this.checked;
    		$$invalidate(4, formData);
    	}

    	function input1_change_handler_3() {
    		formData.stand = this.checked;
    		$$invalidate(4, formData);
    	}

    	function input2_change_handler_3() {
    		formData.holder = this.checked;
    		$$invalidate(4, formData);
    	}

    	function input3_change_handler_3() {
    		formData.pipe_extend = this.checked;
    		$$invalidate(4, formData);
    	}

    	function input4_input_handler_3() {
    		formData.pipe_extend_length = to_number(this.value);
    		$$invalidate(4, formData);
    	}

    	function input5_change_handler_3() {
    		formData.wrinkle = this.checked;
    		$$invalidate(4, formData);
    	}

    	function input6_input_handler_3() {
    		formData.wrinkle_length = to_number(this.value);
    		$$invalidate(4, formData);
    	}

    	function input7_change_handler_3() {
    		formData.welding = this.checked;
    		$$invalidate(4, formData);
    	}

    	function input8_change_handler_3() {
    		formData.gas = this.checked;
    		$$invalidate(4, formData);
    	}

    	function input9_change_handler_3() {
    		formData.drain_pump = this.checked;
    		$$invalidate(4, formData);
    	}

    	function input10_input_handler_3() {
    		formData.drain_pump_length = to_number(this.value);
    		$$invalidate(4, formData);
    	}

    	function input11_change_handler_3() {
    		formData.hole = this.checked;
    		$$invalidate(4, formData);
    	}

    	function input12_input_handler_3() {
    		formData.hole_amount = to_number(this.value);
    		$$invalidate(4, formData);
    	}

    	function input13_change_handler_3() {
    		formData.danger_fee = this.checked;
    		$$invalidate(4, formData);
    	}

    	function input14_change_handler_3() {
    		formData.drain_kit = this.checked;
    		$$invalidate(4, formData);
    	}

    	function input15_change_handler_3() {
    		formData.union_kit = this.checked;
    		$$invalidate(4, formData);
    	}

    	function input16_change_handler_3() {
    		formData.power_line = this.checked;
    		$$invalidate(4, formData);
    	}

    	function input17_change_handler_3() {
    		formData.air_guide = this.checked;
    		$$invalidate(4, formData);
    	}

    	function textarea_input_handler_1() {
    		formData.comment = this.value;
    		$$invalidate(4, formData);
    	}

    	function alert_showAlert_binding_1(value) {
    		showAlert = value;
    		$$invalidate(2, showAlert);
    	}

    	function alert_message_binding_1(value) {
    		message = value;
    		$$invalidate(3, message);
    	}

    	const click_handler_5 = () => pop();

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(14, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		pop,
    		getRequest,
    		insertResult,
    		getResult,
    		getStatus,
    		updateResult,
    		setStatus,
    		ImageHeader,
    		Alert,
    		App,
    		onMount,
    		statusString,
    		statusColor,
    		resultData,
    		status,
    		params,
    		requestNo,
    		getData,
    		showAlert,
    		message,
    		formData,
    		validateValues,
    		changeStatus,
    		validatePrice,
    		modify,
    		submitted,
    		insertResultData,
    		handleSubmit,
    		updateResultData,
    		handleUpdate
    	});

    	$$self.$inject_state = $$props => {
    		if ("resultData" in $$props) $$invalidate(0, resultData = $$props.resultData);
    		if ("status" in $$props) $$invalidate(1, status = $$props.status);
    		if ("params" in $$props) $$invalidate(14, params = $$props.params);
    		if ("showAlert" in $$props) $$invalidate(2, showAlert = $$props.showAlert);
    		if ("message" in $$props) $$invalidate(3, message = $$props.message);
    		if ("formData" in $$props) $$invalidate(4, formData = $$props.formData);
    		if ("modify" in $$props) $$invalidate(5, modify = $$props.modify);
    		if ("submitted" in $$props) $$invalidate(6, submitted = $$props.submitted);
    		if ("insertResultData" in $$props) insertResultData = $$props.insertResultData;
    		if ("updateResultData" in $$props) updateResultData = $$props.updateResultData;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		resultData,
    		status,
    		showAlert,
    		message,
    		formData,
    		modify,
    		submitted,
    		statusString,
    		statusColor,
    		requestNo,
    		getData,
    		changeStatus,
    		handleSubmit,
    		handleUpdate,
    		params,
    		click_handler,
    		click_handler_1,
    		input0_change_handler,
    		input1_change_handler,
    		input2_change_handler,
    		input3_change_handler,
    		input4_input_handler,
    		input5_change_handler,
    		input6_input_handler,
    		input7_change_handler,
    		input8_change_handler,
    		input9_change_handler,
    		input10_input_handler,
    		input11_change_handler,
    		input12_input_handler,
    		input13_change_handler,
    		input14_change_handler,
    		input15_change_handler,
    		input16_change_handler,
    		input17_change_handler,
    		input18_input_handler,
    		input19_input_handler,
    		input0_change_handler_1,
    		input1_change_handler_1,
    		input2_change_handler_1,
    		input3_change_handler_1,
    		input4_input_handler_1,
    		input5_change_handler_1,
    		input6_input_handler_1,
    		input7_change_handler_1,
    		input8_change_handler_1,
    		input9_change_handler_1,
    		input10_input_handler_1,
    		input11_change_handler_1,
    		input12_input_handler_1,
    		input13_change_handler_1,
    		input14_change_handler_1,
    		input15_change_handler_1,
    		input16_change_handler_1,
    		input17_change_handler_1,
    		input18_input_handler_1,
    		input19_input_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		input0_change_handler_2,
    		input1_change_handler_2,
    		input2_change_handler_2,
    		input3_change_handler_2,
    		input4_input_handler_2,
    		input5_change_handler_2,
    		input6_input_handler_2,
    		input7_change_handler_2,
    		input8_change_handler_2,
    		input9_change_handler_2,
    		input10_input_handler_2,
    		input11_change_handler_2,
    		input12_input_handler_2,
    		input13_change_handler_2,
    		input14_change_handler_2,
    		input15_change_handler_2,
    		input16_change_handler_2,
    		input17_change_handler_2,
    		textarea_input_handler,
    		alert_showAlert_binding,
    		alert_message_binding,
    		input18_input_handler_2,
    		input19_input_handler_2,
    		input0_change_handler_3,
    		input1_change_handler_3,
    		input2_change_handler_3,
    		input3_change_handler_3,
    		input4_input_handler_3,
    		input5_change_handler_3,
    		input6_input_handler_3,
    		input7_change_handler_3,
    		input8_change_handler_3,
    		input9_change_handler_3,
    		input10_input_handler_3,
    		input11_change_handler_3,
    		input12_input_handler_3,
    		input13_change_handler_3,
    		input14_change_handler_3,
    		input15_change_handler_3,
    		input16_change_handler_3,
    		input17_change_handler_3,
    		textarea_input_handler_1,
    		alert_showAlert_binding_1,
    		alert_message_binding_1,
    		click_handler_5
    	];
    }

    class Viewer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, { params: 14 }, [-1, -1, -1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Viewer",
    			options,
    			id: create_fragment$n.name
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

    const file$f = "src/routes/NotFound.svelte";

    function create_fragment$m(ctx) {
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
    			add_location(h1, file$f, 3, 0, 20);
    			add_location(p, file$f, 4, 0, 35);
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
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props) {
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
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotFound",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    /* src/routes/Home.svelte generated by Svelte v3.38.2 */

    function create_fragment$l(ctx) {
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
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props) {
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
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$l.name
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
    const file$e = "src/routes/List.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (1:0) <script>   import { push }
    function create_catch_block$1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(1:0) <script>   import { push }",
    		ctx
    	});

    	return block;
    }

    // (38:6) {:then result}
    function create_then_block$1(ctx) {
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
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
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
    			add_location(h6, file$e, 39, 10, 1188);
    			attr_dev(div, "class", "col-12 d-flex justify-content-end mb-2");
    			add_location(div, file$e, 38, 8, 1125);
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
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
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
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(38:6) {:then result}",
    		ctx
    	});

    	return block;
    }

    // (42:8) {#each result.data.list as data}
    function create_each_block$3(ctx) {
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
    			add_location(img, file$e, 51, 24, 1713);
    			attr_dev(div0, "class", "d-flex justify-content-center align-items-center w-100 h-100");
    			add_location(div0, file$e, 48, 22, 1567);
    			attr_dev(div1, "class", "content p-2 svelte-gypvp0");
    			add_location(div1, file$e, 47, 20, 1519);
    			attr_dev(div2, "class", "square bg-light rounded-5 svelte-gypvp0");
    			add_location(div2, file$e, 46, 18, 1459);
    			attr_dev(div3, "class", "col-4 col-md-5");
    			add_location(div3, file$e, 45, 16, 1412);
    			attr_dev(i, "class", "fas fa-user-circle m-1");
    			add_location(i, file$e, 66, 28, 2336);
    			attr_dev(h5, "class", "card-title mb-0");
    			add_location(h5, file$e, 65, 26, 2279);
    			attr_dev(div4, "class", "");
    			add_location(div4, file$e, 64, 24, 2238);
    			attr_dev(span0, "class", span0_class_value = "badge " + /*statusColor*/ ctx[5][/*data*/ ctx[12].request_status] + " svelte-gypvp0");
    			add_location(span0, file$e, 70, 26, 2512);
    			attr_dev(div5, "class", "");
    			add_location(div5, file$e, 69, 24, 2471);
    			attr_dev(div6, "class", "d-flex m-0 p-0 justify-content-between");
    			add_location(div6, file$e, 63, 22, 2161);
    			attr_dev(div7, "class", "row");
    			add_location(div7, file$e, 62, 20, 2121);
    			attr_dev(span1, "class", "badge bg-light text-dark m-0");
    			add_location(span1, file$e, 80, 24, 2915);
    			attr_dev(div8, "class", "col mb-3");
    			add_location(div8, file$e, 79, 22, 2868);
    			attr_dev(div9, "class", "row");
    			add_location(div9, file$e, 78, 20, 2828);
    			add_location(small, file$e, 87, 24, 3247);
    			attr_dev(p, "class", "card-text text-end my-auto");
    			add_location(p, file$e, 86, 22, 3184);
    			attr_dev(div10, "class", "row mt-3 mt-md-5 mb-md-3");
    			add_location(div10, file$e, 85, 20, 3123);
    			attr_dev(button, "class", "btn btn-primary w-100");
    			add_location(button, file$e, 90, 20, 3352);
    			attr_dev(div11, "class", "card-body");
    			add_location(div11, file$e, 61, 18, 2077);
    			attr_dev(div12, "class", "col");
    			add_location(div12, file$e, 60, 16, 2041);
    			attr_dev(div13, "class", "row");
    			add_location(div13, file$e, 44, 14, 1378);
    			attr_dev(div14, "class", "card");
    			add_location(div14, file$e, 43, 12, 1345);
    			attr_dev(div15, "class", "col-lg-6 col-12 mb-3");
    			add_location(div15, file$e, 42, 10, 1298);
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

    			if (dirty & /*getList*/ 2 && span0_class_value !== (span0_class_value = "badge " + /*statusColor*/ ctx[5][/*data*/ ctx[12].request_status] + " svelte-gypvp0")) {
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
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(42:8) {#each result.data.list as data}",
    		ctx
    	});

    	return block;
    }

    // (36:22)          <p>loading</p>       {:then result}
    function create_pending_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "loading";
    			add_location(p, file$e, 36, 8, 1081);
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
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(36:22)          <p>loading</p>       {:then result}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let listheader;
    	let updating_status;
    	let t;
    	let main;
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
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 11
    	};

    	handle_promise(promise = /*getList*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			create_component(listheader.$$.fragment);
    			t = space();
    			main = element("main");
    			div1 = element("div");
    			div0 = element("div");
    			info.block.c();
    			attr_dev(div0, "class", "row d-flex justify-content-start");
    			add_location(div0, file$e, 34, 4, 1003);
    			attr_dev(div1, "class", "container p-2");
    			add_location(div1, file$e, 33, 2, 971);
    			attr_dev(main, "class", "svelte-gypvp0");
    			add_location(main, file$e, 32, 0, 962);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(listheader, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
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
    			if (detaching) detach_dev(main);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const contentsPerPage = 10;

    function instance$k($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* node_modules/svelte-lightbox/src/LightboxThumbnail.svelte generated by Svelte v3.38.2 */
    const file$d = "node_modules/svelte-lightbox/src/LightboxThumbnail.svelte";

    function create_fragment$j(ctx) {
    	let div1;
    	let div0;
    	let div0_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", div0_class_value = "" + (null_to_empty(/*classes*/ ctx[0]) + " svelte-1u332e1"));
    			attr_dev(div0, "style", /*style*/ ctx[1]);
    			toggle_class(div0, "svelte-lightbox-unselectable", /*protect*/ ctx[2]);
    			add_location(div0, file$d, 11, 4, 296);
    			attr_dev(div1, "class", "clickable svelte-1u332e1");
    			add_location(div1, file$d, 10, 0, 231);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*classes*/ 1 && div0_class_value !== (div0_class_value = "" + (null_to_empty(/*classes*/ ctx[0]) + " svelte-1u332e1"))) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (!current || dirty & /*style*/ 2) {
    				attr_dev(div0, "style", /*style*/ ctx[1]);
    			}

    			if (dirty & /*classes, protect*/ 5) {
    				toggle_class(div0, "svelte-lightbox-unselectable", /*protect*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LightboxThumbnail", slots, ['default']);
    	const dispatch = createEventDispatcher();
    	let { class: classes = "" } = $$props;
    	let { style = "" } = $$props;
    	let { protect = false } = $$props;
    	const writable_props = ["class", "style", "protect"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LightboxThumbnail> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch("click");

    	$$self.$$set = $$props => {
    		if ("class" in $$props) $$invalidate(0, classes = $$props.class);
    		if ("style" in $$props) $$invalidate(1, style = $$props.style);
    		if ("protect" in $$props) $$invalidate(2, protect = $$props.protect);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		classes,
    		style,
    		protect
    	});

    	$$self.$inject_state = $$props => {
    		if ("classes" in $$props) $$invalidate(0, classes = $$props.classes);
    		if ("style" in $$props) $$invalidate(1, style = $$props.style);
    		if ("protect" in $$props) $$invalidate(2, protect = $$props.protect);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [classes, style, protect, dispatch, $$scope, slots, click_handler];
    }

    class LightboxThumbnail extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, { class: 0, style: 1, protect: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LightboxThumbnail",
    			options,
    			id: create_fragment$j.name
    		});
    	}

    	get class() {
    		throw new Error("<LightboxThumbnail>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<LightboxThumbnail>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<LightboxThumbnail>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<LightboxThumbnail>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get protect() {
    		throw new Error("<LightboxThumbnail>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set protect(value) {
    		throw new Error("<LightboxThumbnail>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    /* node_modules/svelte-lightbox/src/Modal/LightboxHeader.svelte generated by Svelte v3.38.2 */
    const file$c = "node_modules/svelte-lightbox/src/Modal/LightboxHeader.svelte";

    // (13:4) {#if closeButton}
    function create_if_block$4(ctx) {
    	let button;
    	let t;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("×");
    			attr_dev(button, "size", /*size*/ ctx[0]);
    			attr_dev(button, "style", /*style*/ ctx[1]);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*buttonClasses*/ ctx[3]) + " svelte-12yipzn"));
    			add_location(button, file$c, 13, 8, 365);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size*/ 1) {
    				attr_dev(button, "size", /*size*/ ctx[0]);
    			}

    			if (dirty & /*style*/ 2) {
    				attr_dev(button, "style", /*style*/ ctx[1]);
    			}

    			if (dirty & /*buttonClasses*/ 8 && button_class_value !== (button_class_value = "" + (null_to_empty(/*buttonClasses*/ ctx[3]) + " svelte-12yipzn"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(13:4) {#if closeButton}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let div;
    	let div_class_value;
    	let if_block = /*closeButton*/ ctx[4] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty("svelte-lightbox-header " + /*headerClasses*/ ctx[2]) + " svelte-12yipzn"));
    			add_location(div, file$c, 11, 0, 279);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*closeButton*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*headerClasses*/ 4 && div_class_value !== (div_class_value = "" + (null_to_empty("svelte-lightbox-header " + /*headerClasses*/ ctx[2]) + " svelte-12yipzn"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LightboxHeader", slots, []);
    	const dispatch = createEventDispatcher();
    	let { size = "xs" } = $$props;
    	let { style = "" } = $$props;
    	let { headerClasses = "" } = $$props;
    	let { buttonClasses = "" } = $$props;
    	let { closeButton = true } = $$props;
    	const writable_props = ["size", "style", "headerClasses", "buttonClasses", "closeButton"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LightboxHeader> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch("close");

    	$$self.$$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("style" in $$props) $$invalidate(1, style = $$props.style);
    		if ("headerClasses" in $$props) $$invalidate(2, headerClasses = $$props.headerClasses);
    		if ("buttonClasses" in $$props) $$invalidate(3, buttonClasses = $$props.buttonClasses);
    		if ("closeButton" in $$props) $$invalidate(4, closeButton = $$props.closeButton);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		size,
    		style,
    		headerClasses,
    		buttonClasses,
    		closeButton
    	});

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("style" in $$props) $$invalidate(1, style = $$props.style);
    		if ("headerClasses" in $$props) $$invalidate(2, headerClasses = $$props.headerClasses);
    		if ("buttonClasses" in $$props) $$invalidate(3, buttonClasses = $$props.buttonClasses);
    		if ("closeButton" in $$props) $$invalidate(4, closeButton = $$props.closeButton);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		size,
    		style,
    		headerClasses,
    		buttonClasses,
    		closeButton,
    		dispatch,
    		click_handler
    	];
    }

    class LightboxHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {
    			size: 0,
    			style: 1,
    			headerClasses: 2,
    			buttonClasses: 3,
    			closeButton: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LightboxHeader",
    			options,
    			id: create_fragment$i.name
    		});
    	}

    	get size() {
    		throw new Error("<LightboxHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<LightboxHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<LightboxHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<LightboxHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get headerClasses() {
    		throw new Error("<LightboxHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set headerClasses(value) {
    		throw new Error("<LightboxHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get buttonClasses() {
    		throw new Error("<LightboxHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set buttonClasses(value) {
    		throw new Error("<LightboxHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeButton() {
    		throw new Error("<LightboxHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeButton(value) {
    		throw new Error("<LightboxHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-lightbox/src/Modal/LightboxBody.svelte generated by Svelte v3.38.2 */

    const { console: console_1$1 } = globals;
    const file$b = "node_modules/svelte-lightbox/src/Modal/LightboxBody.svelte";

    // (43:4) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelte-5blj8a");
    			toggle_class(div, "svelte-lightbox-image-portrait", /*portrait*/ ctx[2]);
    			toggle_class(div, "expand", /*imagePreset*/ ctx[3] == "expand");
    			toggle_class(div, "fit", /*imagePreset*/ ctx[3] == "fit");
    			add_location(div, file$b, 43, 8, 1302);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[8](div);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 64)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, null, null);
    				}
    			}

    			if (dirty & /*portrait*/ 4) {
    				toggle_class(div, "svelte-lightbox-image-portrait", /*portrait*/ ctx[2]);
    			}

    			if (dirty & /*imagePreset*/ 8) {
    				toggle_class(div, "expand", /*imagePreset*/ ctx[3] == "expand");
    			}

    			if (dirty & /*imagePreset*/ 8) {
    				toggle_class(div, "fit", /*imagePreset*/ ctx[3] == "fit");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[8](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(43:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (41:4) {#if image.src}
    function create_if_block$3(ctx) {
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let img_style_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*image*/ ctx[0].src)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*image*/ ctx[0].alt);
    			attr_dev(img, "style", img_style_value = /*image*/ ctx[0].style);
    			attr_dev(img, "class", /*imageClass*/ ctx[5]);
    			add_location(img, file$b, 41, 8, 1205);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*image*/ 1 && img.src !== (img_src_value = /*image*/ ctx[0].src)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*image*/ 1 && img_alt_value !== (img_alt_value = /*image*/ ctx[0].alt)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*image*/ 1 && img_style_value !== (img_style_value = /*image*/ ctx[0].style)) {
    				attr_dev(img, "style", img_style_value);
    			}

    			if (dirty & /*imageClass*/ 32) {
    				attr_dev(img, "class", /*imageClass*/ ctx[5]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(41:4) {#if image.src}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*image*/ ctx[0].src) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "svelte-lightbox-body svelte-5blj8a");
    			toggle_class(div, "svelte-lightbox-unselectable", /*protect*/ ctx[1]);
    			add_location(div, file$b, 39, 0, 1097);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
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
    				if_block.m(div, null);
    			}

    			if (dirty & /*protect*/ 2) {
    				toggle_class(div, "svelte-lightbox-unselectable", /*protect*/ ctx[1]);
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
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let imageClass;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LightboxBody", slots, ['default']);
    	let { image = {} } = $$props;
    	let { protect = false } = $$props;
    	let { portrait = false } = $$props;
    	let { imagePreset = false } = $$props;
    	let imageParent;

    	const presets = {
    		fit: {
    			width: "",
    			maxWidth: "80vw",
    			height: "",
    			maxHeight: "80vh"
    		},
    		expand: {
    			width: "100%",
    			maxWidth: "",
    			height: "auto",
    			maxHeight: ""
    		},
    		scroll: {
    			width: "auto",
    			height: "auto",
    			overflow: "scroll"
    		}
    	};

    	const writable_props = ["image", "protect", "portrait", "imagePreset"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<LightboxBody> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			imageParent = $$value;
    			$$invalidate(4, imageParent);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    		if ("protect" in $$props) $$invalidate(1, protect = $$props.protect);
    		if ("portrait" in $$props) $$invalidate(2, portrait = $$props.portrait);
    		if ("imagePreset" in $$props) $$invalidate(3, imagePreset = $$props.imagePreset);
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		image,
    		protect,
    		portrait,
    		imagePreset,
    		imageParent,
    		presets,
    		imageClass
    	});

    	$$self.$inject_state = $$props => {
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    		if ("protect" in $$props) $$invalidate(1, protect = $$props.protect);
    		if ("portrait" in $$props) $$invalidate(2, portrait = $$props.portrait);
    		if ("imagePreset" in $$props) $$invalidate(3, imagePreset = $$props.imagePreset);
    		if ("imageParent" in $$props) $$invalidate(4, imageParent = $$props.imageParent);
    		if ("imageClass" in $$props) $$invalidate(5, imageClass = $$props.imageClass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*imageParent, imagePreset*/ 24) {
    			if (imageParent && imagePreset) {
    				const imageStyle = imageParent.firstChild.style;
    				imageStyle.width = presets[imagePreset].width;
    				imageStyle.height = presets[imagePreset].height;
    				imageStyle.maxWidth = presets[imagePreset].maxWidth;
    				imageStyle.maxHeight = presets[imagePreset].maxHeight;
    				imageStyle.overflow = presets[imagePreset].overflow;
    			}
    		}

    		if ($$self.$$.dirty & /*imagePreset*/ 8) {
    			console.log("imagePreset:", imagePreset);
    		}

    		if ($$self.$$.dirty & /*image, imagePreset*/ 9) {
    			$$invalidate(5, imageClass = `${image.class} ${imagePreset ? imagePreset : ""}`);
    		}
    	};

    	return [
    		image,
    		protect,
    		portrait,
    		imagePreset,
    		imageParent,
    		imageClass,
    		$$scope,
    		slots,
    		div_binding
    	];
    }

    class LightboxBody extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {
    			image: 0,
    			protect: 1,
    			portrait: 2,
    			imagePreset: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LightboxBody",
    			options,
    			id: create_fragment$h.name
    		});
    	}

    	get image() {
    		throw new Error("<LightboxBody>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<LightboxBody>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get protect() {
    		throw new Error("<LightboxBody>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set protect(value) {
    		throw new Error("<LightboxBody>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get portrait() {
    		throw new Error("<LightboxBody>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set portrait(value) {
    		throw new Error("<LightboxBody>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get imagePreset() {
    		throw new Error("<LightboxBody>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imagePreset(value) {
    		throw new Error("<LightboxBody>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-lightbox/src/Modal/LightboxFooter.svelte generated by Svelte v3.38.2 */

    const file$a = "node_modules/svelte-lightbox/src/Modal/LightboxFooter.svelte";

    // (18:4) {#if galleryLength}
    function create_if_block$2(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*activeImage*/ ctx[3] + 1 + "";
    	let t1;
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Image ");
    			t1 = text(t1_value);
    			t2 = text(" of ");
    			t3 = text(/*galleryLength*/ ctx[2]);
    			add_location(p, file$a, 18, 8, 373);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*activeImage*/ 8 && t1_value !== (t1_value = /*activeImage*/ ctx[3] + 1 + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*galleryLength*/ 4) set_data_dev(t3, /*galleryLength*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(18:4) {#if galleryLength}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let div;
    	let h2;
    	let t0;
    	let h5;
    	let t1;
    	let div_class_value;
    	let if_block = /*galleryLength*/ ctx[2] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = space();
    			h5 = element("h5");
    			t1 = space();
    			if (if_block) if_block.c();
    			add_location(h2, file$a, 11, 4, 257);
    			add_location(h5, file$a, 14, 4, 298);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty("svelte-lightbox-footer " + /*classes*/ ctx[4]) + " svelte-1u8lh7d"));
    			attr_dev(div, "style", /*style*/ ctx[5]);
    			add_location(div, file$a, 10, 0, 195);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			h2.innerHTML = /*title*/ ctx[0];
    			append_dev(div, t0);
    			append_dev(div, h5);
    			h5.innerHTML = /*description*/ ctx[1];
    			append_dev(div, t1);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) h2.innerHTML = /*title*/ ctx[0];			if (dirty & /*description*/ 2) h5.innerHTML = /*description*/ ctx[1];
    			if (/*galleryLength*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*classes*/ 16 && div_class_value !== (div_class_value = "" + (null_to_empty("svelte-lightbox-footer " + /*classes*/ ctx[4]) + " svelte-1u8lh7d"))) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*style*/ 32) {
    				attr_dev(div, "style", /*style*/ ctx[5]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LightboxFooter", slots, []);
    	let { title = "" } = $$props;
    	let { description = "" } = $$props;
    	let { galleryLength } = $$props;
    	let { activeImage } = $$props;
    	let { classes = "" } = $$props;
    	let { style = "" } = $$props;
    	const writable_props = ["title", "description", "galleryLength", "activeImage", "classes", "style"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LightboxFooter> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("description" in $$props) $$invalidate(1, description = $$props.description);
    		if ("galleryLength" in $$props) $$invalidate(2, galleryLength = $$props.galleryLength);
    		if ("activeImage" in $$props) $$invalidate(3, activeImage = $$props.activeImage);
    		if ("classes" in $$props) $$invalidate(4, classes = $$props.classes);
    		if ("style" in $$props) $$invalidate(5, style = $$props.style);
    	};

    	$$self.$capture_state = () => ({
    		title,
    		description,
    		galleryLength,
    		activeImage,
    		classes,
    		style
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("description" in $$props) $$invalidate(1, description = $$props.description);
    		if ("galleryLength" in $$props) $$invalidate(2, galleryLength = $$props.galleryLength);
    		if ("activeImage" in $$props) $$invalidate(3, activeImage = $$props.activeImage);
    		if ("classes" in $$props) $$invalidate(4, classes = $$props.classes);
    		if ("style" in $$props) $$invalidate(5, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, description, galleryLength, activeImage, classes, style];
    }

    class LightboxFooter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {
    			title: 0,
    			description: 1,
    			galleryLength: 2,
    			activeImage: 3,
    			classes: 4,
    			style: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LightboxFooter",
    			options,
    			id: create_fragment$g.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*galleryLength*/ ctx[2] === undefined && !("galleryLength" in props)) {
    			console.warn("<LightboxFooter> was created without expected prop 'galleryLength'");
    		}

    		if (/*activeImage*/ ctx[3] === undefined && !("activeImage" in props)) {
    			console.warn("<LightboxFooter> was created without expected prop 'activeImage'");
    		}
    	}

    	get title() {
    		throw new Error("<LightboxFooter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<LightboxFooter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<LightboxFooter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<LightboxFooter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get galleryLength() {
    		throw new Error("<LightboxFooter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set galleryLength(value) {
    		throw new Error("<LightboxFooter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeImage() {
    		throw new Error("<LightboxFooter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeImage(value) {
    		throw new Error("<LightboxFooter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<LightboxFooter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<LightboxFooter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<LightboxFooter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<LightboxFooter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-lightbox/src/Modal/ModalCover.svelte generated by Svelte v3.38.2 */
    const file$9 = "node_modules/svelte-lightbox/src/Modal/ModalCover.svelte";

    function create_fragment$f(ctx) {
    	let div;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelte-o5rrpx");
    			add_location(div, file$9, 12, 0, 255);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);

    				if (!div_intro) div_intro = create_in_transition(div, fade, {
    					duration: /*transitionDuration*/ ctx[0] * 2
    				});

    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			if (div_intro) div_intro.invalidate();

    			div_outro = create_out_transition(div, fade, {
    				duration: /*transitionDuration*/ ctx[0] / 2
    			});

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ModalCover", slots, ['default']);
    	let { transitionDuration } = $$props;
    	const dispatch = createEventDispatcher();

    	const click = () => {
    		dispatch("click");
    	};

    	const writable_props = ["transitionDuration"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ModalCover> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("transitionDuration" in $$props) $$invalidate(0, transitionDuration = $$props.transitionDuration);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		createEventDispatcher,
    		transitionDuration,
    		dispatch,
    		click
    	});

    	$$self.$inject_state = $$props => {
    		if ("transitionDuration" in $$props) $$invalidate(0, transitionDuration = $$props.transitionDuration);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [transitionDuration, $$scope, slots, click_handler];
    }

    class ModalCover extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { transitionDuration: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalCover",
    			options,
    			id: create_fragment$f.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*transitionDuration*/ ctx[0] === undefined && !("transitionDuration" in props)) {
    			console.warn("<ModalCover> was created without expected prop 'transitionDuration'");
    		}
    	}

    	get transitionDuration() {
    		throw new Error("<ModalCover>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionDuration(value) {
    		throw new Error("<ModalCover>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-lightbox/src/Modal/Modal.svelte generated by Svelte v3.38.2 */
    const file$8 = "node_modules/svelte-lightbox/src/Modal/Modal.svelte";

    function create_fragment$e(ctx) {
    	let div;
    	let div_class_value;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*modalClasses*/ ctx[0]) + " svelte-1nx05o5"));
    			add_location(div, file$8, 15, 0, 312);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*modalClasses*/ 1 && div_class_value !== (div_class_value = "" + (null_to_empty(/*modalClasses*/ ctx[0]) + " svelte-1nx05o5"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: /*transitionDuration*/ ctx[1] }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: /*transitionDuration*/ ctx[1] }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Modal", slots, ['default']);
    	const dispatch = createEventDispatcher();
    	let { modalStyle } = $$props;
    	let { modalClasses } = $$props;
    	let { transitionDuration } = $$props;

    	const click = () => {
    		dispatch("click");
    	};

    	const writable_props = ["modalStyle", "modalClasses", "transitionDuration"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("modalStyle" in $$props) $$invalidate(2, modalStyle = $$props.modalStyle);
    		if ("modalClasses" in $$props) $$invalidate(0, modalClasses = $$props.modalClasses);
    		if ("transitionDuration" in $$props) $$invalidate(1, transitionDuration = $$props.transitionDuration);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		createEventDispatcher,
    		dispatch,
    		modalStyle,
    		modalClasses,
    		transitionDuration,
    		click
    	});

    	$$self.$inject_state = $$props => {
    		if ("modalStyle" in $$props) $$invalidate(2, modalStyle = $$props.modalStyle);
    		if ("modalClasses" in $$props) $$invalidate(0, modalClasses = $$props.modalClasses);
    		if ("transitionDuration" in $$props) $$invalidate(1, transitionDuration = $$props.transitionDuration);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [modalClasses, transitionDuration, modalStyle, $$scope, slots, click_handler];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {
    			modalStyle: 2,
    			modalClasses: 0,
    			transitionDuration: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*modalStyle*/ ctx[2] === undefined && !("modalStyle" in props)) {
    			console.warn("<Modal> was created without expected prop 'modalStyle'");
    		}

    		if (/*modalClasses*/ ctx[0] === undefined && !("modalClasses" in props)) {
    			console.warn("<Modal> was created without expected prop 'modalClasses'");
    		}

    		if (/*transitionDuration*/ ctx[1] === undefined && !("transitionDuration" in props)) {
    			console.warn("<Modal> was created without expected prop 'transitionDuration'");
    		}
    	}

    	get modalStyle() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set modalStyle(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get modalClasses() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set modalClasses(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transitionDuration() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionDuration(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-lightbox/src/Modal/Index.svelte generated by Svelte v3.38.2 */

    // (44:8) <Body bind:image={image} bind:protect={protect} bind:portrait={portrait} bind:imagePreset>
    function create_default_slot_2$2(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[15].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[31], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[1] & /*$$scope*/ 1)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[31], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$2.name,
    		type: "slot",
    		source: "(44:8) <Body bind:image={image} bind:protect={protect} bind:portrait={portrait} bind:imagePreset>",
    		ctx
    	});

    	return block;
    }

    // (41:4) <Modal bind:modalClasses bind:modalStyle bind:transitionDuration on:click={ () => dispatch('modalClick') }>
    function create_default_slot_1$3(ctx) {
    	let header;
    	let updating_closeButton;
    	let t0;
    	let body;
    	let updating_image;
    	let updating_protect;
    	let updating_portrait;
    	let updating_imagePreset;
    	let t1;
    	let footer;
    	let updating_title;
    	let updating_description;
    	let updating_activeImage;
    	let current;

    	function header_closeButton_binding(value) {
    		/*header_closeButton_binding*/ ctx[16](value);
    	}

    	let header_props = {};

    	if (/*closeButton*/ ctx[8] !== void 0) {
    		header_props.closeButton = /*closeButton*/ ctx[8];
    	}

    	header = new LightboxHeader({ props: header_props, $$inline: true });
    	binding_callbacks.push(() => bind(header, "closeButton", header_closeButton_binding));
    	header.$on("close", /*close_handler*/ ctx[17]);

    	function body_image_binding(value) {
    		/*body_image_binding*/ ctx[18](value);
    	}

    	function body_protect_binding(value) {
    		/*body_protect_binding*/ ctx[19](value);
    	}

    	function body_portrait_binding(value) {
    		/*body_portrait_binding*/ ctx[20](value);
    	}

    	function body_imagePreset_binding(value) {
    		/*body_imagePreset_binding*/ ctx[21](value);
    	}

    	let body_props = {
    		$$slots: { default: [create_default_slot_2$2] },
    		$$scope: { ctx }
    	};

    	if (/*image*/ ctx[4] !== void 0) {
    		body_props.image = /*image*/ ctx[4];
    	}

    	if (/*protect*/ ctx[5] !== void 0) {
    		body_props.protect = /*protect*/ ctx[5];
    	}

    	if (/*portrait*/ ctx[6] !== void 0) {
    		body_props.portrait = /*portrait*/ ctx[6];
    	}

    	if (/*imagePreset*/ ctx[7] !== void 0) {
    		body_props.imagePreset = /*imagePreset*/ ctx[7];
    	}

    	body = new LightboxBody({ props: body_props, $$inline: true });
    	binding_callbacks.push(() => bind(body, "image", body_image_binding));
    	binding_callbacks.push(() => bind(body, "protect", body_protect_binding));
    	binding_callbacks.push(() => bind(body, "portrait", body_portrait_binding));
    	binding_callbacks.push(() => bind(body, "imagePreset", body_imagePreset_binding));

    	function footer_title_binding(value) {
    		/*footer_title_binding*/ ctx[22](value);
    	}

    	function footer_description_binding(value) {
    		/*footer_description_binding*/ ctx[23](value);
    	}

    	function footer_activeImage_binding(value) {
    		/*footer_activeImage_binding*/ ctx[24](value);
    	}

    	let footer_props = {
    		galleryLength: /*gallery*/ ctx[9] ? /*gallery*/ ctx[9].length : false
    	};

    	if (/*actualTitle*/ ctx[10] !== void 0) {
    		footer_props.title = /*actualTitle*/ ctx[10];
    	}

    	if (/*actualDescription*/ ctx[11] !== void 0) {
    		footer_props.description = /*actualDescription*/ ctx[11];
    	}

    	if (/*activeImage*/ ctx[0] !== void 0) {
    		footer_props.activeImage = /*activeImage*/ ctx[0];
    	}

    	footer = new LightboxFooter({ props: footer_props, $$inline: true });
    	binding_callbacks.push(() => bind(footer, "title", footer_title_binding));
    	binding_callbacks.push(() => bind(footer, "description", footer_description_binding));
    	binding_callbacks.push(() => bind(footer, "activeImage", footer_activeImage_binding));

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			create_component(body.$$.fragment);
    			t1 = space();
    			create_component(footer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(body, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const header_changes = {};

    			if (!updating_closeButton && dirty[0] & /*closeButton*/ 256) {
    				updating_closeButton = true;
    				header_changes.closeButton = /*closeButton*/ ctx[8];
    				add_flush_callback(() => updating_closeButton = false);
    			}

    			header.$set(header_changes);
    			const body_changes = {};

    			if (dirty[1] & /*$$scope*/ 1) {
    				body_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_image && dirty[0] & /*image*/ 16) {
    				updating_image = true;
    				body_changes.image = /*image*/ ctx[4];
    				add_flush_callback(() => updating_image = false);
    			}

    			if (!updating_protect && dirty[0] & /*protect*/ 32) {
    				updating_protect = true;
    				body_changes.protect = /*protect*/ ctx[5];
    				add_flush_callback(() => updating_protect = false);
    			}

    			if (!updating_portrait && dirty[0] & /*portrait*/ 64) {
    				updating_portrait = true;
    				body_changes.portrait = /*portrait*/ ctx[6];
    				add_flush_callback(() => updating_portrait = false);
    			}

    			if (!updating_imagePreset && dirty[0] & /*imagePreset*/ 128) {
    				updating_imagePreset = true;
    				body_changes.imagePreset = /*imagePreset*/ ctx[7];
    				add_flush_callback(() => updating_imagePreset = false);
    			}

    			body.$set(body_changes);
    			const footer_changes = {};
    			if (dirty[0] & /*gallery*/ 512) footer_changes.galleryLength = /*gallery*/ ctx[9] ? /*gallery*/ ctx[9].length : false;

    			if (!updating_title && dirty[0] & /*actualTitle*/ 1024) {
    				updating_title = true;
    				footer_changes.title = /*actualTitle*/ ctx[10];
    				add_flush_callback(() => updating_title = false);
    			}

    			if (!updating_description && dirty[0] & /*actualDescription*/ 2048) {
    				updating_description = true;
    				footer_changes.description = /*actualDescription*/ ctx[11];
    				add_flush_callback(() => updating_description = false);
    			}

    			if (!updating_activeImage && dirty[0] & /*activeImage*/ 1) {
    				updating_activeImage = true;
    				footer_changes.activeImage = /*activeImage*/ ctx[0];
    				add_flush_callback(() => updating_activeImage = false);
    			}

    			footer.$set(footer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(body.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(body.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(body, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(41:4) <Modal bind:modalClasses bind:modalStyle bind:transitionDuration on:click={ () => dispatch('modalClick') }>",
    		ctx
    	});

    	return block;
    }

    // (40:0) <ModalCover bind:transitionDuration on:click={ () => dispatch('topModalClick') }>
    function create_default_slot$3(ctx) {
    	let modal;
    	let updating_modalClasses;
    	let updating_modalStyle;
    	let updating_transitionDuration;
    	let current;

    	function modal_modalClasses_binding(value) {
    		/*modal_modalClasses_binding*/ ctx[25](value);
    	}

    	function modal_modalStyle_binding(value) {
    		/*modal_modalStyle_binding*/ ctx[26](value);
    	}

    	function modal_transitionDuration_binding(value) {
    		/*modal_transitionDuration_binding*/ ctx[27](value);
    	}

    	let modal_props = {
    		$$slots: { default: [create_default_slot_1$3] },
    		$$scope: { ctx }
    	};

    	if (/*modalClasses*/ ctx[1] !== void 0) {
    		modal_props.modalClasses = /*modalClasses*/ ctx[1];
    	}

    	if (/*modalStyle*/ ctx[2] !== void 0) {
    		modal_props.modalStyle = /*modalStyle*/ ctx[2];
    	}

    	if (/*transitionDuration*/ ctx[3] !== void 0) {
    		modal_props.transitionDuration = /*transitionDuration*/ ctx[3];
    	}

    	modal = new Modal({ props: modal_props, $$inline: true });
    	binding_callbacks.push(() => bind(modal, "modalClasses", modal_modalClasses_binding));
    	binding_callbacks.push(() => bind(modal, "modalStyle", modal_modalStyle_binding));
    	binding_callbacks.push(() => bind(modal, "transitionDuration", modal_transitionDuration_binding));
    	modal.$on("click", /*click_handler*/ ctx[28]);

    	const block = {
    		c: function create() {
    			create_component(modal.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const modal_changes = {};

    			if (dirty[0] & /*gallery, actualTitle, actualDescription, activeImage, image, protect, portrait, imagePreset, closeButton*/ 4081 | dirty[1] & /*$$scope*/ 1) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_modalClasses && dirty[0] & /*modalClasses*/ 2) {
    				updating_modalClasses = true;
    				modal_changes.modalClasses = /*modalClasses*/ ctx[1];
    				add_flush_callback(() => updating_modalClasses = false);
    			}

    			if (!updating_modalStyle && dirty[0] & /*modalStyle*/ 4) {
    				updating_modalStyle = true;
    				modal_changes.modalStyle = /*modalStyle*/ ctx[2];
    				add_flush_callback(() => updating_modalStyle = false);
    			}

    			if (!updating_transitionDuration && dirty[0] & /*transitionDuration*/ 8) {
    				updating_transitionDuration = true;
    				modal_changes.transitionDuration = /*transitionDuration*/ ctx[3];
    				add_flush_callback(() => updating_transitionDuration = false);
    			}

    			modal.$set(modal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(40:0) <ModalCover bind:transitionDuration on:click={ () => dispatch('topModalClick') }>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let modalcover;
    	let updating_transitionDuration;
    	let current;

    	function modalcover_transitionDuration_binding(value) {
    		/*modalcover_transitionDuration_binding*/ ctx[29](value);
    	}

    	let modalcover_props = {
    		$$slots: { default: [create_default_slot$3] },
    		$$scope: { ctx }
    	};

    	if (/*transitionDuration*/ ctx[3] !== void 0) {
    		modalcover_props.transitionDuration = /*transitionDuration*/ ctx[3];
    	}

    	modalcover = new ModalCover({ props: modalcover_props, $$inline: true });
    	binding_callbacks.push(() => bind(modalcover, "transitionDuration", modalcover_transitionDuration_binding));
    	modalcover.$on("click", /*click_handler_1*/ ctx[30]);

    	const block = {
    		c: function create() {
    			create_component(modalcover.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(modalcover, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const modalcover_changes = {};

    			if (dirty[0] & /*modalClasses, modalStyle, transitionDuration, gallery, actualTitle, actualDescription, activeImage, image, protect, portrait, imagePreset, closeButton*/ 4095 | dirty[1] & /*$$scope*/ 1) {
    				modalcover_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_transitionDuration && dirty[0] & /*transitionDuration*/ 8) {
    				updating_transitionDuration = true;
    				modalcover_changes.transitionDuration = /*transitionDuration*/ ctx[3];
    				add_flush_callback(() => updating_transitionDuration = false);
    			}

    			modalcover.$set(modalcover_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modalcover.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modalcover.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modalcover, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, ['default']);
    	const dispatch = createEventDispatcher();
    	let { modalClasses = "" } = $$props;
    	let { modalStyle = "" } = $$props;
    	let { transitionDuration = 500 } = $$props;
    	let { image = {} } = $$props;
    	let { protect = false } = $$props;
    	let { portrait = false } = $$props;
    	let { title = "" } = $$props;
    	let { description = "" } = $$props;
    	let { gallery = [] } = $$props;
    	let { activeImage } = $$props;
    	let { imagePreset } = $$props;
    	let { closeButton } = $$props;
    	let actualTitle;
    	let actualDescription;

    	const writable_props = [
    		"modalClasses",
    		"modalStyle",
    		"transitionDuration",
    		"image",
    		"protect",
    		"portrait",
    		"title",
    		"description",
    		"gallery",
    		"activeImage",
    		"imagePreset",
    		"closeButton"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	function header_closeButton_binding(value) {
    		closeButton = value;
    		$$invalidate(8, closeButton);
    	}

    	const close_handler = () => dispatch("close");

    	function body_image_binding(value) {
    		image = value;
    		$$invalidate(4, image);
    	}

    	function body_protect_binding(value) {
    		protect = value;
    		$$invalidate(5, protect);
    	}

    	function body_portrait_binding(value) {
    		portrait = value;
    		$$invalidate(6, portrait);
    	}

    	function body_imagePreset_binding(value) {
    		imagePreset = value;
    		$$invalidate(7, imagePreset);
    	}

    	function footer_title_binding(value) {
    		actualTitle = value;
    		(((($$invalidate(10, actualTitle), $$invalidate(13, title)), $$invalidate(9, gallery)), $$invalidate(14, description)), $$invalidate(0, activeImage));
    	}

    	function footer_description_binding(value) {
    		actualDescription = value;
    		(((($$invalidate(11, actualDescription), $$invalidate(14, description)), $$invalidate(9, gallery)), $$invalidate(13, title)), $$invalidate(0, activeImage));
    	}

    	function footer_activeImage_binding(value) {
    		activeImage = value;
    		$$invalidate(0, activeImage);
    	}

    	function modal_modalClasses_binding(value) {
    		modalClasses = value;
    		$$invalidate(1, modalClasses);
    	}

    	function modal_modalStyle_binding(value) {
    		modalStyle = value;
    		$$invalidate(2, modalStyle);
    	}

    	function modal_transitionDuration_binding(value) {
    		transitionDuration = value;
    		$$invalidate(3, transitionDuration);
    	}

    	const click_handler = () => dispatch("modalClick");

    	function modalcover_transitionDuration_binding(value) {
    		transitionDuration = value;
    		$$invalidate(3, transitionDuration);
    	}

    	const click_handler_1 = () => dispatch("topModalClick");

    	$$self.$$set = $$props => {
    		if ("modalClasses" in $$props) $$invalidate(1, modalClasses = $$props.modalClasses);
    		if ("modalStyle" in $$props) $$invalidate(2, modalStyle = $$props.modalStyle);
    		if ("transitionDuration" in $$props) $$invalidate(3, transitionDuration = $$props.transitionDuration);
    		if ("image" in $$props) $$invalidate(4, image = $$props.image);
    		if ("protect" in $$props) $$invalidate(5, protect = $$props.protect);
    		if ("portrait" in $$props) $$invalidate(6, portrait = $$props.portrait);
    		if ("title" in $$props) $$invalidate(13, title = $$props.title);
    		if ("description" in $$props) $$invalidate(14, description = $$props.description);
    		if ("gallery" in $$props) $$invalidate(9, gallery = $$props.gallery);
    		if ("activeImage" in $$props) $$invalidate(0, activeImage = $$props.activeImage);
    		if ("imagePreset" in $$props) $$invalidate(7, imagePreset = $$props.imagePreset);
    		if ("closeButton" in $$props) $$invalidate(8, closeButton = $$props.closeButton);
    		if ("$$scope" in $$props) $$invalidate(31, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		createEventDispatcher,
    		Header: LightboxHeader,
    		Body: LightboxBody,
    		Footer: LightboxFooter,
    		ModalCover,
    		Modal,
    		dispatch,
    		modalClasses,
    		modalStyle,
    		transitionDuration,
    		image,
    		protect,
    		portrait,
    		title,
    		description,
    		gallery,
    		activeImage,
    		imagePreset,
    		closeButton,
    		actualTitle,
    		actualDescription
    	});

    	$$self.$inject_state = $$props => {
    		if ("modalClasses" in $$props) $$invalidate(1, modalClasses = $$props.modalClasses);
    		if ("modalStyle" in $$props) $$invalidate(2, modalStyle = $$props.modalStyle);
    		if ("transitionDuration" in $$props) $$invalidate(3, transitionDuration = $$props.transitionDuration);
    		if ("image" in $$props) $$invalidate(4, image = $$props.image);
    		if ("protect" in $$props) $$invalidate(5, protect = $$props.protect);
    		if ("portrait" in $$props) $$invalidate(6, portrait = $$props.portrait);
    		if ("title" in $$props) $$invalidate(13, title = $$props.title);
    		if ("description" in $$props) $$invalidate(14, description = $$props.description);
    		if ("gallery" in $$props) $$invalidate(9, gallery = $$props.gallery);
    		if ("activeImage" in $$props) $$invalidate(0, activeImage = $$props.activeImage);
    		if ("imagePreset" in $$props) $$invalidate(7, imagePreset = $$props.imagePreset);
    		if ("closeButton" in $$props) $$invalidate(8, closeButton = $$props.closeButton);
    		if ("actualTitle" in $$props) $$invalidate(10, actualTitle = $$props.actualTitle);
    		if ("actualDescription" in $$props) $$invalidate(11, actualDescription = $$props.actualDescription);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*title*/ 8192) {
    			// For variable title and description, we need to define this auxiliary variables
    			$$invalidate(10, actualTitle = title);
    		}

    		if ($$self.$$.dirty[0] & /*description*/ 16384) {
    			$$invalidate(11, actualDescription = description);
    		}

    		if ($$self.$$.dirty[0] & /*gallery, title, description, activeImage*/ 25089) {
    			// If there is not universal title or description for gallery, we will display individual title and description
    			if (gallery && !title && !description) {
    				$$invalidate(10, actualTitle = gallery[activeImage].title);
    				$$invalidate(11, actualDescription = gallery[activeImage].description);
    			}
    		}
    	};

    	return [
    		activeImage,
    		modalClasses,
    		modalStyle,
    		transitionDuration,
    		image,
    		protect,
    		portrait,
    		imagePreset,
    		closeButton,
    		gallery,
    		actualTitle,
    		actualDescription,
    		dispatch,
    		title,
    		description,
    		slots,
    		header_closeButton_binding,
    		close_handler,
    		body_image_binding,
    		body_protect_binding,
    		body_portrait_binding,
    		body_imagePreset_binding,
    		footer_title_binding,
    		footer_description_binding,
    		footer_activeImage_binding,
    		modal_modalClasses_binding,
    		modal_modalStyle_binding,
    		modal_transitionDuration_binding,
    		click_handler,
    		modalcover_transitionDuration_binding,
    		click_handler_1,
    		$$scope
    	];
    }

    class Index extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$d,
    			create_fragment$d,
    			safe_not_equal,
    			{
    				modalClasses: 1,
    				modalStyle: 2,
    				transitionDuration: 3,
    				image: 4,
    				protect: 5,
    				portrait: 6,
    				title: 13,
    				description: 14,
    				gallery: 9,
    				activeImage: 0,
    				imagePreset: 7,
    				closeButton: 8
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*activeImage*/ ctx[0] === undefined && !("activeImage" in props)) {
    			console.warn("<Index> was created without expected prop 'activeImage'");
    		}

    		if (/*imagePreset*/ ctx[7] === undefined && !("imagePreset" in props)) {
    			console.warn("<Index> was created without expected prop 'imagePreset'");
    		}

    		if (/*closeButton*/ ctx[8] === undefined && !("closeButton" in props)) {
    			console.warn("<Index> was created without expected prop 'closeButton'");
    		}
    	}

    	get modalClasses() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set modalClasses(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get modalStyle() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set modalStyle(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transitionDuration() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionDuration(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get protect() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set protect(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get portrait() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set portrait(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gallery() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gallery(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeImage() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeImage(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get imagePreset() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imagePreset(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeButton() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeButton(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-lightbox/src/Gallery/InternalGallery.svelte generated by Svelte v3.38.2 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$7 = "node_modules/svelte-lightbox/src/Gallery/InternalGallery.svelte";

    function create_fragment$c(ctx) {
    	let div1;
    	let button0;
    	let svg0;
    	let g0;
    	let path0;
    	let button0_disabled_value;
    	let t0;
    	let div0;
    	let t1;
    	let button1;
    	let svg1;
    	let g1;
    	let path1;
    	let button1_disabled_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			g0 = svg_element("g");
    			path0 = svg_element("path");
    			t0 = space();
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			g1 = svg_element("g");
    			path1 = svg_element("path");
    			attr_dev(path0, "class", "arrow svelte-wwe8hv");
    			attr_dev(path0, "d", "M8.7,7.22,4.59,11.33a1,1,0,0,0,0,1.41l4,4");
    			add_location(path0, file$7, 48, 16, 1742);
    			add_location(g0, file$7, 47, 12, 1722);
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "class", "svelte-wwe8hv");
    			add_location(svg0, file$7, 46, 8, 1649);
    			button0.disabled = button0_disabled_value = /*activeImage*/ ctx[0] === 0;
    			attr_dev(button0, "class", "previous-button svelte-wwe8hv");
    			add_location(button0, file$7, 45, 4, 1554);
    			attr_dev(div0, "class", "slot svelte-wwe8hv");
    			add_location(div0, file$7, 54, 4, 1888);
    			attr_dev(path1, "class", "arrow svelte-wwe8hv");
    			attr_dev(path1, "d", "M15.3,16.78l4.11-4.11a1,1,0,0,0,0-1.41l-4-4");
    			add_location(path1, file$7, 63, 16, 2198);
    			add_location(g1, file$7, 62, 12, 2178);
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "class", "svelte-wwe8hv");
    			add_location(svg1, file$7, 61, 8, 2105);
    			button1.disabled = button1_disabled_value = /*activeImage*/ ctx[0] === /*images*/ ctx[2]?.length - 1;
    			attr_dev(button1, "class", "next-button svelte-wwe8hv");
    			add_location(button1, file$7, 60, 4, 2003);
    			attr_dev(div1, "class", "wrapper svelte-wwe8hv");
    			add_location(div1, file$7, 43, 0, 1504);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, g0);
    			append_dev(g0, path0);
    			append_dev(div1, t0);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			/*div0_binding*/ ctx[7](div0);
    			append_dev(div1, t1);
    			append_dev(div1, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, g1);
    			append_dev(g1, path1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*previousImage*/ ctx[3], false, false, false),
    					listen_dev(button1, "click", /*nextImage*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*activeImage*/ 1 && button0_disabled_value !== (button0_disabled_value = /*activeImage*/ ctx[0] === 0)) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*activeImage, images*/ 5 && button1_disabled_value !== (button1_disabled_value = /*activeImage*/ ctx[0] === /*images*/ ctx[2]?.length - 1)) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			/*div0_binding*/ ctx[7](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("InternalGallery", slots, ['default']);
    	let { activeImage = 0 } = $$props;

    	// Here will be stored markup that will user put inside of this component
    	let slotContent;

    	// Auxiliary variable for storing elements with image that user has provided
    	let images;

    	/*
    Those functions move between active image, we dont need condition to disable their role, because this is already
    implemented in the element section by conditionally disabling buttons, that call this function.

     */
    	const previousImage = () => {
    		$$invalidate(0, activeImage--, activeImage);
    	};

    	const nextImage = () => {
    		$$invalidate(0, activeImage++, activeImage);
    	};

    	const writable_props = ["activeImage"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<InternalGallery> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			slotContent = $$value;
    			$$invalidate(1, slotContent);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("activeImage" in $$props) $$invalidate(0, activeImage = $$props.activeImage);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		activeImage,
    		slotContent,
    		images,
    		previousImage,
    		nextImage
    	});

    	$$self.$inject_state = $$props => {
    		if ("activeImage" in $$props) $$invalidate(0, activeImage = $$props.activeImage);
    		if ("slotContent" in $$props) $$invalidate(1, slotContent = $$props.slotContent);
    		if ("images" in $$props) $$invalidate(2, images = $$props.images);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*slotContent*/ 2) {
    			// Every time, when contents of this component changes, images will be updated
    			$$invalidate(2, images = slotContent?.children);
    		}

    		if ($$self.$$.dirty & /*images, activeImage*/ 5) {
    			{
    				/*
    When activeImage or images array changes, checks if active image points to existing image and then displays it,
    if selected image doesn't exist, then logs out error, these error normally does not occur, only in cases when
    activeImage is controlled programmatically
     */
    				if (images && activeImage < images.length) {
    					Object.values(images).forEach(img => {
    						img.hidden = true;
    						return img;
    					});

    					$$invalidate(2, images[activeImage].hidden = false, images);
    				} else if (images && activeImage >= images.length) {
    					console.error("LightboxGallery: Selected image doesn't exist, invalid activeImage");
    				}
    			}
    		}
    	};

    	return [
    		activeImage,
    		slotContent,
    		images,
    		previousImage,
    		nextImage,
    		$$scope,
    		slots,
    		div0_binding
    	];
    }

    class InternalGallery extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { activeImage: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InternalGallery",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get activeImage() {
    		throw new Error("<InternalGallery>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeImage(value) {
    		throw new Error("<InternalGallery>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-lightbox/src/Lightbox.svelte generated by Svelte v3.38.2 */
    const get_thumbnail_slot_changes_1 = dirty => ({});
    const get_thumbnail_slot_context_1 = ctx => ({});
    const get_image_slot_changes = dirty => ({});
    const get_image_slot_context = ctx => ({});
    const get_thumbnail_slot_changes = dirty => ({});
    const get_thumbnail_slot_context = ctx => ({});

    // (83:4) {:else}
    function create_else_block_1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[22].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[39], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[1] & /*$$scope*/ 256)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[39], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(83:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (81:4) {#if thumbnail || gallery}
    function create_if_block_3(ctx) {
    	let current;
    	const thumbnail_slot_template = /*#slots*/ ctx[22].thumbnail;
    	const thumbnail_slot = create_slot(thumbnail_slot_template, ctx, /*$$scope*/ ctx[39], get_thumbnail_slot_context);

    	const block = {
    		c: function create() {
    			if (thumbnail_slot) thumbnail_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (thumbnail_slot) {
    				thumbnail_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (thumbnail_slot) {
    				if (thumbnail_slot.p && (!current || dirty[1] & /*$$scope*/ 256)) {
    					update_slot(thumbnail_slot, thumbnail_slot_template, ctx, /*$$scope*/ ctx[39], dirty, get_thumbnail_slot_changes, get_thumbnail_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(thumbnail_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(thumbnail_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (thumbnail_slot) thumbnail_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(81:4) {#if thumbnail || gallery}",
    		ctx
    	});

    	return block;
    }

    // (80:0) <Thumbnail bind:thumbnailClasses bind:thumbnailStyle bind:protect on:click={toggle}>
    function create_default_slot_2$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_3, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*thumbnail*/ ctx[14] || /*gallery*/ ctx[5]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
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
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(80:0) <Thumbnail bind:thumbnailClasses bind:thumbnailStyle bind:protect on:click={toggle}>",
    		ctx
    	});

    	return block;
    }

    // (88:0) {#if visible}
    function create_if_block$1(ctx) {
    	let modal;
    	let updating_modalClasses;
    	let updating_modalStyle;
    	let updating_transitionDuration;
    	let updating_image;
    	let updating_protect;
    	let updating_portrait;
    	let updating_title;
    	let updating_description;
    	let updating_gallery;
    	let updating_activeImage;
    	let updating_imagePreset;
    	let updating_closeButton;
    	let current;

    	function modal_modalClasses_binding(value) {
    		/*modal_modalClasses_binding*/ ctx[27](value);
    	}

    	function modal_modalStyle_binding(value) {
    		/*modal_modalStyle_binding*/ ctx[28](value);
    	}

    	function modal_transitionDuration_binding(value) {
    		/*modal_transitionDuration_binding*/ ctx[29](value);
    	}

    	function modal_image_binding(value) {
    		/*modal_image_binding*/ ctx[30](value);
    	}

    	function modal_protect_binding(value) {
    		/*modal_protect_binding*/ ctx[31](value);
    	}

    	function modal_portrait_binding(value) {
    		/*modal_portrait_binding*/ ctx[32](value);
    	}

    	function modal_title_binding(value) {
    		/*modal_title_binding*/ ctx[33](value);
    	}

    	function modal_description_binding(value) {
    		/*modal_description_binding*/ ctx[34](value);
    	}

    	function modal_gallery_binding(value) {
    		/*modal_gallery_binding*/ ctx[35](value);
    	}

    	function modal_activeImage_binding(value) {
    		/*modal_activeImage_binding*/ ctx[36](value);
    	}

    	function modal_imagePreset_binding(value) {
    		/*modal_imagePreset_binding*/ ctx[37](value);
    	}

    	function modal_closeButton_binding(value) {
    		/*modal_closeButton_binding*/ ctx[38](value);
    	}

    	let modal_props = {
    		$$slots: { default: [create_default_slot$2] },
    		$$scope: { ctx }
    	};

    	if (/*modalClasses*/ ctx[2] !== void 0) {
    		modal_props.modalClasses = /*modalClasses*/ ctx[2];
    	}

    	if (/*modalStyle*/ ctx[3] !== void 0) {
    		modal_props.modalStyle = /*modalStyle*/ ctx[3];
    	}

    	if (/*transitionDuration*/ ctx[8] !== void 0) {
    		modal_props.transitionDuration = /*transitionDuration*/ ctx[8];
    	}

    	if (/*image*/ ctx[10] !== void 0) {
    		modal_props.image = /*image*/ ctx[10];
    	}

    	if (/*protect*/ ctx[9] !== void 0) {
    		modal_props.protect = /*protect*/ ctx[9];
    	}

    	if (/*portrait*/ ctx[11] !== void 0) {
    		modal_props.portrait = /*portrait*/ ctx[11];
    	}

    	if (/*title*/ ctx[6] !== void 0) {
    		modal_props.title = /*title*/ ctx[6];
    	}

    	if (/*description*/ ctx[7] !== void 0) {
    		modal_props.description = /*description*/ ctx[7];
    	}

    	if (/*gallery*/ ctx[5] !== void 0) {
    		modal_props.gallery = /*gallery*/ ctx[5];
    	}

    	if (/*activeImage*/ ctx[4] !== void 0) {
    		modal_props.activeImage = /*activeImage*/ ctx[4];
    	}

    	if (/*imagePreset*/ ctx[12] !== void 0) {
    		modal_props.imagePreset = /*imagePreset*/ ctx[12];
    	}

    	if (/*closeButton*/ ctx[13] !== void 0) {
    		modal_props.closeButton = /*closeButton*/ ctx[13];
    	}

    	modal = new Index({ props: modal_props, $$inline: true });
    	binding_callbacks.push(() => bind(modal, "modalClasses", modal_modalClasses_binding));
    	binding_callbacks.push(() => bind(modal, "modalStyle", modal_modalStyle_binding));
    	binding_callbacks.push(() => bind(modal, "transitionDuration", modal_transitionDuration_binding));
    	binding_callbacks.push(() => bind(modal, "image", modal_image_binding));
    	binding_callbacks.push(() => bind(modal, "protect", modal_protect_binding));
    	binding_callbacks.push(() => bind(modal, "portrait", modal_portrait_binding));
    	binding_callbacks.push(() => bind(modal, "title", modal_title_binding));
    	binding_callbacks.push(() => bind(modal, "description", modal_description_binding));
    	binding_callbacks.push(() => bind(modal, "gallery", modal_gallery_binding));
    	binding_callbacks.push(() => bind(modal, "activeImage", modal_activeImage_binding));
    	binding_callbacks.push(() => bind(modal, "imagePreset", modal_imagePreset_binding));
    	binding_callbacks.push(() => bind(modal, "closeButton", modal_closeButton_binding));
    	modal.$on("close", /*close*/ ctx[17]);
    	modal.$on("topModalClick", /*coverClick*/ ctx[18]);
    	modal.$on("modalClick", /*modalClick*/ ctx[19]);

    	const block = {
    		c: function create() {
    			create_component(modal.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const modal_changes = {};

    			if (dirty[0] & /*thumbnail, activeImage, gallery*/ 16432 | dirty[1] & /*$$scope*/ 256) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_modalClasses && dirty[0] & /*modalClasses*/ 4) {
    				updating_modalClasses = true;
    				modal_changes.modalClasses = /*modalClasses*/ ctx[2];
    				add_flush_callback(() => updating_modalClasses = false);
    			}

    			if (!updating_modalStyle && dirty[0] & /*modalStyle*/ 8) {
    				updating_modalStyle = true;
    				modal_changes.modalStyle = /*modalStyle*/ ctx[3];
    				add_flush_callback(() => updating_modalStyle = false);
    			}

    			if (!updating_transitionDuration && dirty[0] & /*transitionDuration*/ 256) {
    				updating_transitionDuration = true;
    				modal_changes.transitionDuration = /*transitionDuration*/ ctx[8];
    				add_flush_callback(() => updating_transitionDuration = false);
    			}

    			if (!updating_image && dirty[0] & /*image*/ 1024) {
    				updating_image = true;
    				modal_changes.image = /*image*/ ctx[10];
    				add_flush_callback(() => updating_image = false);
    			}

    			if (!updating_protect && dirty[0] & /*protect*/ 512) {
    				updating_protect = true;
    				modal_changes.protect = /*protect*/ ctx[9];
    				add_flush_callback(() => updating_protect = false);
    			}

    			if (!updating_portrait && dirty[0] & /*portrait*/ 2048) {
    				updating_portrait = true;
    				modal_changes.portrait = /*portrait*/ ctx[11];
    				add_flush_callback(() => updating_portrait = false);
    			}

    			if (!updating_title && dirty[0] & /*title*/ 64) {
    				updating_title = true;
    				modal_changes.title = /*title*/ ctx[6];
    				add_flush_callback(() => updating_title = false);
    			}

    			if (!updating_description && dirty[0] & /*description*/ 128) {
    				updating_description = true;
    				modal_changes.description = /*description*/ ctx[7];
    				add_flush_callback(() => updating_description = false);
    			}

    			if (!updating_gallery && dirty[0] & /*gallery*/ 32) {
    				updating_gallery = true;
    				modal_changes.gallery = /*gallery*/ ctx[5];
    				add_flush_callback(() => updating_gallery = false);
    			}

    			if (!updating_activeImage && dirty[0] & /*activeImage*/ 16) {
    				updating_activeImage = true;
    				modal_changes.activeImage = /*activeImage*/ ctx[4];
    				add_flush_callback(() => updating_activeImage = false);
    			}

    			if (!updating_imagePreset && dirty[0] & /*imagePreset*/ 4096) {
    				updating_imagePreset = true;
    				modal_changes.imagePreset = /*imagePreset*/ ctx[12];
    				add_flush_callback(() => updating_imagePreset = false);
    			}

    			if (!updating_closeButton && dirty[0] & /*closeButton*/ 8192) {
    				updating_closeButton = true;
    				modal_changes.closeButton = /*closeButton*/ ctx[13];
    				add_flush_callback(() => updating_closeButton = false);
    			}

    			modal.$set(modal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(88:0) {#if visible}",
    		ctx
    	});

    	return block;
    }

    // (100:8) {:else}
    function create_else_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[22].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[39], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[1] & /*$$scope*/ 256)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[39], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(100:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (94:26) 
    function create_if_block_2(ctx) {
    	let internalgallery;
    	let updating_activeImage;
    	let current;

    	function internalgallery_activeImage_binding(value) {
    		/*internalgallery_activeImage_binding*/ ctx[26](value);
    	}

    	let internalgallery_props = {
    		$$slots: { default: [create_default_slot_1$2] },
    		$$scope: { ctx }
    	};

    	if (/*activeImage*/ ctx[4] !== void 0) {
    		internalgallery_props.activeImage = /*activeImage*/ ctx[4];
    	}

    	internalgallery = new InternalGallery({
    			props: internalgallery_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(internalgallery, "activeImage", internalgallery_activeImage_binding));

    	const block = {
    		c: function create() {
    			create_component(internalgallery.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(internalgallery, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const internalgallery_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				internalgallery_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_activeImage && dirty[0] & /*activeImage*/ 16) {
    				updating_activeImage = true;
    				internalgallery_changes.activeImage = /*activeImage*/ ctx[4];
    				add_flush_callback(() => updating_activeImage = false);
    			}

    			internalgallery.$set(internalgallery_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(internalgallery.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(internalgallery.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(internalgallery, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(94:26) ",
    		ctx
    	});

    	return block;
    }

    // (92:8) {#if thumbnail}
    function create_if_block_1(ctx) {
    	let current;
    	const image_slot_template = /*#slots*/ ctx[22].image;
    	const image_slot = create_slot(image_slot_template, ctx, /*$$scope*/ ctx[39], get_image_slot_context);

    	const block = {
    		c: function create() {
    			if (image_slot) image_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (image_slot) {
    				image_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (image_slot) {
    				if (image_slot.p && (!current || dirty[1] & /*$$scope*/ 256)) {
    					update_slot(image_slot, image_slot_template, ctx, /*$$scope*/ ctx[39], dirty, get_image_slot_changes, get_image_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (image_slot) image_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(92:8) {#if thumbnail}",
    		ctx
    	});

    	return block;
    }

    // (95:12) <InternalGallery bind:activeImage>
    function create_default_slot_1$2(ctx) {
    	let t;
    	let current;
    	const thumbnail_slot_template = /*#slots*/ ctx[22].thumbnail;
    	const thumbnail_slot = create_slot(thumbnail_slot_template, ctx, /*$$scope*/ ctx[39], get_thumbnail_slot_context_1);
    	const default_slot_template = /*#slots*/ ctx[22].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[39], null);

    	const block = {
    		c: function create() {
    			if (thumbnail_slot) thumbnail_slot.c();
    			t = space();
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (thumbnail_slot) {
    				thumbnail_slot.m(target, anchor);
    			}

    			insert_dev(target, t, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (thumbnail_slot) {
    				if (thumbnail_slot.p && (!current || dirty[1] & /*$$scope*/ 256)) {
    					update_slot(thumbnail_slot, thumbnail_slot_template, ctx, /*$$scope*/ ctx[39], dirty, get_thumbnail_slot_changes_1, get_thumbnail_slot_context_1);
    				}
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[1] & /*$$scope*/ 256)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[39], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(thumbnail_slot, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(thumbnail_slot, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (thumbnail_slot) thumbnail_slot.d(detaching);
    			if (detaching) detach_dev(t);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(95:12) <InternalGallery bind:activeImage>",
    		ctx
    	});

    	return block;
    }

    // (89:4) <Modal bind:modalClasses bind:modalStyle bind:transitionDuration bind:image bind:protect            bind:portrait bind:title bind:description bind:gallery bind:activeImage bind:imagePreset bind:closeButton            on:close={close} on:topModalClick={coverClick} on:modalClick={modalClick}>
    function create_default_slot$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_if_block_2, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*thumbnail*/ ctx[14]) return 0;
    		if (/*gallery*/ ctx[5]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

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
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(89:4) <Modal bind:modalClasses bind:modalStyle bind:transitionDuration bind:image bind:protect            bind:portrait bind:title bind:description bind:gallery bind:activeImage bind:imagePreset bind:closeButton            on:close={close} on:topModalClick={coverClick} on:modalClick={modalClick}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let thumbnail_1;
    	let updating_thumbnailClasses;
    	let updating_thumbnailStyle;
    	let updating_protect;
    	let t;
    	let if_block_anchor;
    	let current;

    	function thumbnail_1_thumbnailClasses_binding(value) {
    		/*thumbnail_1_thumbnailClasses_binding*/ ctx[23](value);
    	}

    	function thumbnail_1_thumbnailStyle_binding(value) {
    		/*thumbnail_1_thumbnailStyle_binding*/ ctx[24](value);
    	}

    	function thumbnail_1_protect_binding(value) {
    		/*thumbnail_1_protect_binding*/ ctx[25](value);
    	}

    	let thumbnail_1_props = {
    		$$slots: { default: [create_default_slot_2$1] },
    		$$scope: { ctx }
    	};

    	if (/*thumbnailClasses*/ ctx[0] !== void 0) {
    		thumbnail_1_props.thumbnailClasses = /*thumbnailClasses*/ ctx[0];
    	}

    	if (/*thumbnailStyle*/ ctx[1] !== void 0) {
    		thumbnail_1_props.thumbnailStyle = /*thumbnailStyle*/ ctx[1];
    	}

    	if (/*protect*/ ctx[9] !== void 0) {
    		thumbnail_1_props.protect = /*protect*/ ctx[9];
    	}

    	thumbnail_1 = new LightboxThumbnail({ props: thumbnail_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(thumbnail_1, "thumbnailClasses", thumbnail_1_thumbnailClasses_binding));
    	binding_callbacks.push(() => bind(thumbnail_1, "thumbnailStyle", thumbnail_1_thumbnailStyle_binding));
    	binding_callbacks.push(() => bind(thumbnail_1, "protect", thumbnail_1_protect_binding));
    	thumbnail_1.$on("click", /*toggle*/ ctx[16]);
    	let if_block = /*visible*/ ctx[15] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			create_component(thumbnail_1.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(thumbnail_1, target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const thumbnail_1_changes = {};

    			if (dirty[0] & /*thumbnail, gallery*/ 16416 | dirty[1] & /*$$scope*/ 256) {
    				thumbnail_1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_thumbnailClasses && dirty[0] & /*thumbnailClasses*/ 1) {
    				updating_thumbnailClasses = true;
    				thumbnail_1_changes.thumbnailClasses = /*thumbnailClasses*/ ctx[0];
    				add_flush_callback(() => updating_thumbnailClasses = false);
    			}

    			if (!updating_thumbnailStyle && dirty[0] & /*thumbnailStyle*/ 2) {
    				updating_thumbnailStyle = true;
    				thumbnail_1_changes.thumbnailStyle = /*thumbnailStyle*/ ctx[1];
    				add_flush_callback(() => updating_thumbnailStyle = false);
    			}

    			if (!updating_protect && dirty[0] & /*protect*/ 512) {
    				updating_protect = true;
    				thumbnail_1_changes.protect = /*protect*/ ctx[9];
    				add_flush_callback(() => updating_protect = false);
    			}

    			thumbnail_1.$set(thumbnail_1_changes);

    			if (/*visible*/ ctx[15]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*visible*/ 32768) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(thumbnail_1.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(thumbnail_1.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(thumbnail_1, detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
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

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Lightbox", slots, ['thumbnail','default','image']);
    	let { thumbnailClasses = "" } = $$props;
    	let { thumbnailStyle = "" } = $$props;
    	let { modalClasses = "" } = $$props;
    	let { modalStyle = "" } = $$props;
    	let { activeImage = 0 } = $$props;
    	let { gallery = false } = $$props;
    	let { title = "" } = $$props;
    	let { description = "" } = $$props;
    	let { transitionDuration = 500 } = $$props;
    	let { protect = false } = $$props;
    	let { image = {} } = $$props;
    	let { portrait = false } = $$props;
    	let { noScroll = true } = $$props;
    	let { thumbnail = false } = $$props;
    	let { imagePreset = false } = $$props;
    	let { clickToClose = false } = $$props;
    	let { closeButton = true } = $$props;
    	let visible = false;
    	let modalClicked = false;

    	const toggle = () => {
    		$$invalidate(15, visible = !visible);
    		toggleScroll();
    	};

    	const close = () => {
    		$$invalidate(15, visible = false);
    		toggleScroll();
    	};

    	const coverClick = () => {
    		// console.log('coverClick')
    		if (!modalClicked || clickToClose) {
    			close();
    		}

    		modalClicked = false;
    	};

    	const modalClick = () => {
    		// console.log('modalClick')
    		modalClicked = true;
    	};

    	let toggleScroll = () => {
    		
    	};

    	onMount(() => {
    		let defaultOverflow = document.body.style.overflow;

    		toggleScroll = () => {
    			if (noScroll) {
    				if (visible) {
    					document.body.style.overflow = "hidden";
    				} else {
    					document.body.style.overflow = defaultOverflow;
    				}
    			}
    		};
    	});

    	const writable_props = [
    		"thumbnailClasses",
    		"thumbnailStyle",
    		"modalClasses",
    		"modalStyle",
    		"activeImage",
    		"gallery",
    		"title",
    		"description",
    		"transitionDuration",
    		"protect",
    		"image",
    		"portrait",
    		"noScroll",
    		"thumbnail",
    		"imagePreset",
    		"clickToClose",
    		"closeButton"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lightbox> was created with unknown prop '${key}'`);
    	});

    	function thumbnail_1_thumbnailClasses_binding(value) {
    		thumbnailClasses = value;
    		$$invalidate(0, thumbnailClasses);
    	}

    	function thumbnail_1_thumbnailStyle_binding(value) {
    		thumbnailStyle = value;
    		$$invalidate(1, thumbnailStyle);
    	}

    	function thumbnail_1_protect_binding(value) {
    		protect = value;
    		$$invalidate(9, protect);
    	}

    	function internalgallery_activeImage_binding(value) {
    		activeImage = value;
    		$$invalidate(4, activeImage);
    	}

    	function modal_modalClasses_binding(value) {
    		modalClasses = value;
    		$$invalidate(2, modalClasses);
    	}

    	function modal_modalStyle_binding(value) {
    		modalStyle = value;
    		$$invalidate(3, modalStyle);
    	}

    	function modal_transitionDuration_binding(value) {
    		transitionDuration = value;
    		$$invalidate(8, transitionDuration);
    	}

    	function modal_image_binding(value) {
    		image = value;
    		$$invalidate(10, image);
    	}

    	function modal_protect_binding(value) {
    		protect = value;
    		$$invalidate(9, protect);
    	}

    	function modal_portrait_binding(value) {
    		portrait = value;
    		$$invalidate(11, portrait);
    	}

    	function modal_title_binding(value) {
    		title = value;
    		$$invalidate(6, title);
    	}

    	function modal_description_binding(value) {
    		description = value;
    		$$invalidate(7, description);
    	}

    	function modal_gallery_binding(value) {
    		gallery = value;
    		$$invalidate(5, gallery);
    	}

    	function modal_activeImage_binding(value) {
    		activeImage = value;
    		$$invalidate(4, activeImage);
    	}

    	function modal_imagePreset_binding(value) {
    		imagePreset = value;
    		$$invalidate(12, imagePreset);
    	}

    	function modal_closeButton_binding(value) {
    		closeButton = value;
    		$$invalidate(13, closeButton);
    	}

    	$$self.$$set = $$props => {
    		if ("thumbnailClasses" in $$props) $$invalidate(0, thumbnailClasses = $$props.thumbnailClasses);
    		if ("thumbnailStyle" in $$props) $$invalidate(1, thumbnailStyle = $$props.thumbnailStyle);
    		if ("modalClasses" in $$props) $$invalidate(2, modalClasses = $$props.modalClasses);
    		if ("modalStyle" in $$props) $$invalidate(3, modalStyle = $$props.modalStyle);
    		if ("activeImage" in $$props) $$invalidate(4, activeImage = $$props.activeImage);
    		if ("gallery" in $$props) $$invalidate(5, gallery = $$props.gallery);
    		if ("title" in $$props) $$invalidate(6, title = $$props.title);
    		if ("description" in $$props) $$invalidate(7, description = $$props.description);
    		if ("transitionDuration" in $$props) $$invalidate(8, transitionDuration = $$props.transitionDuration);
    		if ("protect" in $$props) $$invalidate(9, protect = $$props.protect);
    		if ("image" in $$props) $$invalidate(10, image = $$props.image);
    		if ("portrait" in $$props) $$invalidate(11, portrait = $$props.portrait);
    		if ("noScroll" in $$props) $$invalidate(20, noScroll = $$props.noScroll);
    		if ("thumbnail" in $$props) $$invalidate(14, thumbnail = $$props.thumbnail);
    		if ("imagePreset" in $$props) $$invalidate(12, imagePreset = $$props.imagePreset);
    		if ("clickToClose" in $$props) $$invalidate(21, clickToClose = $$props.clickToClose);
    		if ("closeButton" in $$props) $$invalidate(13, closeButton = $$props.closeButton);
    		if ("$$scope" in $$props) $$invalidate(39, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Thumbnail: LightboxThumbnail,
    		Modal: Index,
    		InternalGallery,
    		onMount,
    		thumbnailClasses,
    		thumbnailStyle,
    		modalClasses,
    		modalStyle,
    		activeImage,
    		gallery,
    		title,
    		description,
    		transitionDuration,
    		protect,
    		image,
    		portrait,
    		noScroll,
    		thumbnail,
    		imagePreset,
    		clickToClose,
    		closeButton,
    		visible,
    		modalClicked,
    		toggle,
    		close,
    		coverClick,
    		modalClick,
    		toggleScroll
    	});

    	$$self.$inject_state = $$props => {
    		if ("thumbnailClasses" in $$props) $$invalidate(0, thumbnailClasses = $$props.thumbnailClasses);
    		if ("thumbnailStyle" in $$props) $$invalidate(1, thumbnailStyle = $$props.thumbnailStyle);
    		if ("modalClasses" in $$props) $$invalidate(2, modalClasses = $$props.modalClasses);
    		if ("modalStyle" in $$props) $$invalidate(3, modalStyle = $$props.modalStyle);
    		if ("activeImage" in $$props) $$invalidate(4, activeImage = $$props.activeImage);
    		if ("gallery" in $$props) $$invalidate(5, gallery = $$props.gallery);
    		if ("title" in $$props) $$invalidate(6, title = $$props.title);
    		if ("description" in $$props) $$invalidate(7, description = $$props.description);
    		if ("transitionDuration" in $$props) $$invalidate(8, transitionDuration = $$props.transitionDuration);
    		if ("protect" in $$props) $$invalidate(9, protect = $$props.protect);
    		if ("image" in $$props) $$invalidate(10, image = $$props.image);
    		if ("portrait" in $$props) $$invalidate(11, portrait = $$props.portrait);
    		if ("noScroll" in $$props) $$invalidate(20, noScroll = $$props.noScroll);
    		if ("thumbnail" in $$props) $$invalidate(14, thumbnail = $$props.thumbnail);
    		if ("imagePreset" in $$props) $$invalidate(12, imagePreset = $$props.imagePreset);
    		if ("clickToClose" in $$props) $$invalidate(21, clickToClose = $$props.clickToClose);
    		if ("closeButton" in $$props) $$invalidate(13, closeButton = $$props.closeButton);
    		if ("visible" in $$props) $$invalidate(15, visible = $$props.visible);
    		if ("modalClicked" in $$props) modalClicked = $$props.modalClicked;
    		if ("toggleScroll" in $$props) toggleScroll = $$props.toggleScroll;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		thumbnailClasses,
    		thumbnailStyle,
    		modalClasses,
    		modalStyle,
    		activeImage,
    		gallery,
    		title,
    		description,
    		transitionDuration,
    		protect,
    		image,
    		portrait,
    		imagePreset,
    		closeButton,
    		thumbnail,
    		visible,
    		toggle,
    		close,
    		coverClick,
    		modalClick,
    		noScroll,
    		clickToClose,
    		slots,
    		thumbnail_1_thumbnailClasses_binding,
    		thumbnail_1_thumbnailStyle_binding,
    		thumbnail_1_protect_binding,
    		internalgallery_activeImage_binding,
    		modal_modalClasses_binding,
    		modal_modalStyle_binding,
    		modal_transitionDuration_binding,
    		modal_image_binding,
    		modal_protect_binding,
    		modal_portrait_binding,
    		modal_title_binding,
    		modal_description_binding,
    		modal_gallery_binding,
    		modal_activeImage_binding,
    		modal_imagePreset_binding,
    		modal_closeButton_binding,
    		$$scope
    	];
    }

    class Lightbox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$b,
    			create_fragment$b,
    			safe_not_equal,
    			{
    				thumbnailClasses: 0,
    				thumbnailStyle: 1,
    				modalClasses: 2,
    				modalStyle: 3,
    				activeImage: 4,
    				gallery: 5,
    				title: 6,
    				description: 7,
    				transitionDuration: 8,
    				protect: 9,
    				image: 10,
    				portrait: 11,
    				noScroll: 20,
    				thumbnail: 14,
    				imagePreset: 12,
    				clickToClose: 21,
    				closeButton: 13
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lightbox",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get thumbnailClasses() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set thumbnailClasses(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get thumbnailStyle() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set thumbnailStyle(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get modalClasses() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set modalClasses(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get modalStyle() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set modalStyle(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeImage() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeImage(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gallery() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gallery(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transitionDuration() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionDuration(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get protect() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set protect(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get portrait() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set portrait(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noScroll() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noScroll(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get thumbnail() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set thumbnail(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get imagePreset() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imagePreset(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clickToClose() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clickToClose(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeButton() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeButton(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-lightbox/src/Gallery/LightboxImage.svelte generated by Svelte v3.38.2 */

    const file$6 = "node_modules/svelte-lightbox/src/Gallery/LightboxImage.svelte";

    function create_fragment$a(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			div.hidden = true;
    			add_location(div, file$6, 8, 0, 294);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
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
    	validate_slots("LightboxImage", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LightboxImage> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class LightboxImage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LightboxImage",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* node_modules/svelte-lightbox/src/Gallery/ExternalGallery.svelte generated by Svelte v3.38.2 */

    function create_fragment$9(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
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
    	validate_slots("ExternalGallery", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ExternalGallery> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class ExternalGallery extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ExternalGallery",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/routes/Test.svelte generated by Svelte v3.38.2 */
    const file$5 = "src/routes/Test.svelte";

    // (48:0) <Lightbox description="Simple lightbox">
    function create_default_slot_5(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = "path")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Simple lightbox");
    			add_location(img, file$5, 48, 2, 1343);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(48:0) <Lightbox description=\\\"Simple lightbox\\\">",
    		ctx
    	});

    	return block;
    }

    // (63:4) <LightboxImage>
    function create_default_slot_4(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = "./image.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Simple lightbox");
    			add_location(img, file$5, 63, 6, 1929);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(63:4) <LightboxImage>",
    		ctx
    	});

    	return block;
    }

    // (66:4) <LightboxImage>
    function create_default_slot_3(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = "./image.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Simple lightbox");
    			add_location(img, file$5, 66, 6, 2024);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(66:4) <LightboxImage>",
    		ctx
    	});

    	return block;
    }

    // (69:4) <LightboxImage>
    function create_default_slot_2(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = "./image.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Simple lightbox");
    			add_location(img, file$5, 69, 6, 2119);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(69:4) <LightboxImage>",
    		ctx
    	});

    	return block;
    }

    // (62:2) <LightboxGallery>
    function create_default_slot_1$1(ctx) {
    	let lightboximage0;
    	let t0;
    	let lightboximage1;
    	let t1;
    	let lightboximage2;
    	let current;

    	lightboximage0 = new LightboxImage({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	lightboximage1 = new LightboxImage({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	lightboximage2 = new LightboxImage({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(lightboximage0.$$.fragment);
    			t0 = space();
    			create_component(lightboximage1.$$.fragment);
    			t1 = space();
    			create_component(lightboximage2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(lightboximage0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(lightboximage1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(lightboximage2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const lightboximage0_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				lightboximage0_changes.$$scope = { dirty, ctx };
    			}

    			lightboximage0.$set(lightboximage0_changes);
    			const lightboximage1_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				lightboximage1_changes.$$scope = { dirty, ctx };
    			}

    			lightboximage1.$set(lightboximage1_changes);
    			const lightboximage2_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				lightboximage2_changes.$$scope = { dirty, ctx };
    			}

    			lightboximage2.$set(lightboximage2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lightboximage0.$$.fragment, local);
    			transition_in(lightboximage1.$$.fragment, local);
    			transition_in(lightboximage2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lightboximage0.$$.fragment, local);
    			transition_out(lightboximage1.$$.fragment, local);
    			transition_out(lightboximage2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(lightboximage0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(lightboximage1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(lightboximage2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(62:2) <LightboxGallery>",
    		ctx
    	});

    	return block;
    }

    // (57:0) <Lightbox {gallery}>
    function create_default_slot$1(ctx) {
    	let lightboxgallery;
    	let current;

    	lightboxgallery = new ExternalGallery({
    			props: {
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(lightboxgallery.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(lightboxgallery, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const lightboxgallery_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				lightboxgallery_changes.$$scope = { dirty, ctx };
    			}

    			lightboxgallery.$set(lightboxgallery_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lightboxgallery.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lightboxgallery.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(lightboxgallery, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(57:0) <Lightbox {gallery}>",
    		ctx
    	});

    	return block;
    }

    // (61:2) 
    function create_thumbnail_slot(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "slot", "thumbnail");
    			if (img.src !== (img_src_value = "./image.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Simple lightbox");
    			add_location(img, file$5, 60, 2, 1818);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_thumbnail_slot.name,
    		type: "slot",
    		source: "(61:2) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let lightbox0;
    	let t;
    	let lightbox1;
    	let current;

    	lightbox0 = new Lightbox({
    			props: {
    				description: "Simple lightbox",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	lightbox1 = new Lightbox({
    			props: {
    				gallery: /*gallery*/ ctx[0],
    				$$slots: {
    					thumbnail: [create_thumbnail_slot],
    					default: [create_default_slot$1]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(lightbox0.$$.fragment);
    			t = space();
    			create_component(lightbox1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(lightbox0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(lightbox1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const lightbox0_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				lightbox0_changes.$$scope = { dirty, ctx };
    			}

    			lightbox0.$set(lightbox0_changes);
    			const lightbox1_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				lightbox1_changes.$$scope = { dirty, ctx };
    			}

    			lightbox1.$set(lightbox1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lightbox0.$$.fragment, local);
    			transition_in(lightbox1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lightbox0.$$.fragment, local);
    			transition_out(lightbox1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(lightbox0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(lightbox1, detaching);
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
    	validate_slots("Test", slots, []);

    	const gallery = [
    		{
    			title: "Cat is eating mouse",
    			description: "Pretty cruel, ieurgv eoirhe hgioh vihvieh vn  if neib "
    		},
    		{
    			title: "Bike is driven",
    			description: `LOL, What a sentence, eriugherheh ioghieo `
    		},
    		{
    			title: "JS components are downloaded from npm",
    			description: "Obviously, jrgoer iojre oigejgi heiruoiqevj eoirhjv ioehh ve"
    		},
    		{
    			title: "This component is under development",
    			description: `So don't stake your life on it, but it should be pretty stable`
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Test> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Lightbox,
    		LightboxImage,
    		LightboxGallery: ExternalGallery,
    		gallery
    	});

    	return [gallery];
    }

    class Test extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Test",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* node_modules/svelte-swipe/src/Swipe.svelte generated by Svelte v3.38.2 */
    const file$4 = "node_modules/svelte-swipe/src/Swipe.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[42] = list[i];
    	child_ctx[44] = i;
    	return child_ctx;
    }

    // (272:3) {#if showIndicators}
    function create_if_block(ctx) {
    	let div;
    	let each_value = /*indicators*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "swipe-indicator swipe-indicator-inside svelte-j4f7n2");
    			add_location(div, file$4, 272, 5, 7065);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*activeIndicator, changeItem, indicators*/ 70) {
    				each_value = /*indicators*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
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
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(272:3) {#if showIndicators}",
    		ctx
    	});

    	return block;
    }

    // (274:8) {#each indicators as x, i }
    function create_each_block$2(ctx) {
    	let span;
    	let span_class_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[22](/*i*/ ctx[44]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");

    			attr_dev(span, "class", span_class_value = "dot " + (/*activeIndicator*/ ctx[1] == /*i*/ ctx[44]
    			? "is-active"
    			: "") + " svelte-j4f7n2");

    			add_location(span, file$4, 274, 10, 7166);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*activeIndicator*/ 2 && span_class_value !== (span_class_value = "dot " + (/*activeIndicator*/ ctx[1] == /*i*/ ctx[44]
    			? "is-active"
    			: "") + " svelte-j4f7n2")) {
    				attr_dev(span, "class", span_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(274:8) {#each indicators as x, i }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div4;
    	let div2;
    	let div1;
    	let div0;
    	let t0;
    	let div3;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[19].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[18], null);
    	let if_block = /*showIndicators*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			t0 = space();
    			div3 = element("div");
    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "swipeable-slot-wrapper svelte-j4f7n2");
    			add_location(div0, file$4, 265, 6, 6826);
    			attr_dev(div1, "class", "swipeable-total_elements svelte-j4f7n2");
    			add_location(div1, file$4, 264, 4, 6780);
    			attr_dev(div2, "class", "swipe-item-wrapper svelte-j4f7n2");
    			add_location(div2, file$4, 263, 2, 6717);
    			attr_dev(div3, "class", "swipe-handler svelte-j4f7n2");
    			add_location(div3, file$4, 270, 2, 6920);
    			attr_dev(div4, "class", "swipe-panel svelte-j4f7n2");
    			add_location(div4, file$4, 262, 0, 6688);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			/*div2_binding*/ ctx[20](div2);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			/*div3_binding*/ ctx[21](div3);
    			append_dev(div4, t1);
    			if (if_block) if_block.m(div4, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div3, "touchstart", /*onMoveStart*/ ctx[5], false, false, false),
    					listen_dev(div3, "mousedown", /*onMoveStart*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*$$scope*/ 262144)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[18], dirty, null, null);
    				}
    			}

    			if (/*showIndicators*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div4, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (default_slot) default_slot.d(detaching);
    			/*div2_binding*/ ctx[20](null);
    			/*div3_binding*/ ctx[21](null);
    			if (if_block) if_block.d();
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
    	validate_slots("Swipe", slots, ['default']);
    	let { transitionDuration = 200 } = $$props;
    	let { showIndicators = false } = $$props;
    	let { autoplay = false } = $$props;
    	let { delay = 1000 } = $$props;
    	let { defaultIndex = 0 } = $$props;
    	let { active_item = 0 } = $$props; //readonly
    	let { is_vertical = false } = $$props;

    	let activeIndicator = 0,
    		indicators,
    		total_elements = 0,
    		availableSpace = 0,
    		availableMeasure = 0,
    		swipeElements,
    		availableDistance = 0,
    		swipeWrapper,
    		swipeHandler,
    		pos_axis = 0,
    		page_axis = is_vertical ? "pageY" : "pageX",
    		axis,
    		longTouch,
    		last_axis_pos;

    	let played = defaultIndex || 0;
    	let run_interval = false;

    	function init() {
    		swipeElements = swipeWrapper.querySelectorAll(".swipeable-item");
    		$$invalidate(16, total_elements = swipeElements.length);
    		update();
    	}

    	function update() {
    		let { offsetWidth, offsetHeight } = swipeWrapper.querySelector(".swipeable-total_elements");
    		availableSpace = is_vertical ? offsetHeight : offsetWidth;

    		[...swipeElements].forEach((element, i) => {
    			element.style.transform = generateTranslateValue(availableSpace * i);
    		});

    		availableDistance = 0;
    		availableMeasure = availableSpace * (total_elements - 1);

    		if (defaultIndex) {
    			changeItem(defaultIndex);
    		}
    	}

    	// helpers
    	function eventDelegate(type) {
    		let delegationTypes = {
    			add: "addEventListener",
    			remove: "removeEventListener"
    		};

    		if (typeof window !== "undefined") {
    			window[delegationTypes[type]]("mousemove", onMove);
    			window[delegationTypes[type]]("mouseup", onEnd);
    			window[delegationTypes[type]]("touchmove", onMove, { passive: false });
    			window[delegationTypes[type]]("touchend", onEnd, { passive: false });
    		}
    	}

    	function generateTranslateValue(value) {
    		return is_vertical
    		? `translate3d(0, ${value}px, 0)`
    		: `translate3d(${value}px, 0, 0)`;
    	}

    	function generateTouchPosCss(value, touch_end = false) {
    		let transformString = generateTranslateValue(value);

    		let _css = `
      -webkit-transition-duration: ${touch_end ? transitionDuration : "0"}ms;
      transition-duration: ${touch_end ? transitionDuration : "0"}ms;
      -webkit-transform: ${transformString};
      -ms-transform: ${transformString};`;

    		return _css;
    	}

    	onMount(() => {
    		init();

    		if (typeof window !== "undefined") {
    			window.addEventListener("resize", update);
    		}
    	});

    	onDestroy(() => {
    		if (typeof window !== "undefined") {
    			window.removeEventListener("resize", update);
    		}
    	});

    	let touch_active = false;

    	function onMove(e) {
    		if (touch_active) {
    			e.stopImmediatePropagation();
    			e.stopPropagation();

    			let _axis = e.touches ? e.touches[0][page_axis] : e[page_axis],
    				distance = axis - _axis + pos_axis;

    			if (pos_axis == 0 && axis < _axis || pos_axis == availableMeasure && axis > _axis) {
    				return;
    			}

    			e.preventDefault();

    			if (distance <= availableMeasure && distance >= 0) {
    				[...swipeElements].forEach((element, i) => {
    					element.style.cssText = generateTouchPosCss(availableSpace * i - distance);
    				});

    				availableDistance = distance;
    				last_axis_pos = _axis;
    			}
    		}
    	}

    	function onMoveStart(e) {
    		// e.preventDefault();
    		e.stopImmediatePropagation();

    		e.stopPropagation();
    		touch_active = true;
    		longTouch = false;

    		setTimeout(
    			function () {
    				longTouch = true;
    			},
    			250
    		);

    		axis = e.touches ? e.touches[0][page_axis] : e[page_axis];
    		eventDelegate("add");
    	}

    	function onEnd(e) {
    		if (e && e.cancelable) {
    			e.preventDefault();
    		}

    		e && e.stopImmediatePropagation();
    		e && e.stopPropagation();
    		let direction = axis < last_axis_pos;
    		touch_active = false;
    		let _as = availableSpace;
    		let accidental_touch = Math.round(availableSpace / 50) > Math.abs(axis - last_axis_pos);

    		if (longTouch || accidental_touch) {
    			availableDistance = Math.round(availableDistance / _as) * _as;
    		} else {
    			availableDistance = direction
    			? Math.floor(availableDistance / _as) * _as
    			: Math.ceil(availableDistance / _as) * _as;
    		}

    		axis = null;
    		last_axis_pos = null;
    		pos_axis = availableDistance;
    		$$invalidate(1, activeIndicator = availableDistance / _as);

    		[...swipeElements].forEach((element, i) => {
    			element.style.cssText = generateTouchPosCss(_as * i - pos_axis, true);
    		});

    		$$invalidate(8, active_item = activeIndicator);
    		$$invalidate(7, defaultIndex = active_item);
    		eventDelegate("remove");
    	}

    	function changeItem(item) {
    		let max = availableSpace;
    		availableDistance = max * item;
    		$$invalidate(1, activeIndicator = item);
    		onEnd();
    	}

    	function changeView() {
    		changeItem(played);
    		played = played < total_elements - 1 ? ++played : 0;
    	}

    	function goTo(step) {
    		let item = Math.max(0, Math.min(step, indicators.length - 1));
    		changeItem(item);
    	}

    	function prevItem() {
    		let step = activeIndicator - 1;
    		goTo(step);
    	}

    	function nextItem() {
    		let step = activeIndicator + 1;
    		goTo(step);
    	}

    	const writable_props = [
    		"transitionDuration",
    		"showIndicators",
    		"autoplay",
    		"delay",
    		"defaultIndex",
    		"active_item",
    		"is_vertical"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Swipe> was created with unknown prop '${key}'`);
    	});

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			swipeWrapper = $$value;
    			$$invalidate(3, swipeWrapper);
    		});
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			swipeHandler = $$value;
    			$$invalidate(4, swipeHandler);
    		});
    	}

    	const click_handler = i => {
    		changeItem(i);
    	};

    	$$self.$$set = $$props => {
    		if ("transitionDuration" in $$props) $$invalidate(9, transitionDuration = $$props.transitionDuration);
    		if ("showIndicators" in $$props) $$invalidate(0, showIndicators = $$props.showIndicators);
    		if ("autoplay" in $$props) $$invalidate(10, autoplay = $$props.autoplay);
    		if ("delay" in $$props) $$invalidate(11, delay = $$props.delay);
    		if ("defaultIndex" in $$props) $$invalidate(7, defaultIndex = $$props.defaultIndex);
    		if ("active_item" in $$props) $$invalidate(8, active_item = $$props.active_item);
    		if ("is_vertical" in $$props) $$invalidate(12, is_vertical = $$props.is_vertical);
    		if ("$$scope" in $$props) $$invalidate(18, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		transitionDuration,
    		showIndicators,
    		autoplay,
    		delay,
    		defaultIndex,
    		active_item,
    		is_vertical,
    		activeIndicator,
    		indicators,
    		total_elements,
    		availableSpace,
    		availableMeasure,
    		swipeElements,
    		availableDistance,
    		swipeWrapper,
    		swipeHandler,
    		pos_axis,
    		page_axis,
    		axis,
    		longTouch,
    		last_axis_pos,
    		played,
    		run_interval,
    		init,
    		update,
    		eventDelegate,
    		generateTranslateValue,
    		generateTouchPosCss,
    		touch_active,
    		onMove,
    		onMoveStart,
    		onEnd,
    		changeItem,
    		changeView,
    		goTo,
    		prevItem,
    		nextItem
    	});

    	$$self.$inject_state = $$props => {
    		if ("transitionDuration" in $$props) $$invalidate(9, transitionDuration = $$props.transitionDuration);
    		if ("showIndicators" in $$props) $$invalidate(0, showIndicators = $$props.showIndicators);
    		if ("autoplay" in $$props) $$invalidate(10, autoplay = $$props.autoplay);
    		if ("delay" in $$props) $$invalidate(11, delay = $$props.delay);
    		if ("defaultIndex" in $$props) $$invalidate(7, defaultIndex = $$props.defaultIndex);
    		if ("active_item" in $$props) $$invalidate(8, active_item = $$props.active_item);
    		if ("is_vertical" in $$props) $$invalidate(12, is_vertical = $$props.is_vertical);
    		if ("activeIndicator" in $$props) $$invalidate(1, activeIndicator = $$props.activeIndicator);
    		if ("indicators" in $$props) $$invalidate(2, indicators = $$props.indicators);
    		if ("total_elements" in $$props) $$invalidate(16, total_elements = $$props.total_elements);
    		if ("availableSpace" in $$props) availableSpace = $$props.availableSpace;
    		if ("availableMeasure" in $$props) availableMeasure = $$props.availableMeasure;
    		if ("swipeElements" in $$props) swipeElements = $$props.swipeElements;
    		if ("availableDistance" in $$props) availableDistance = $$props.availableDistance;
    		if ("swipeWrapper" in $$props) $$invalidate(3, swipeWrapper = $$props.swipeWrapper);
    		if ("swipeHandler" in $$props) $$invalidate(4, swipeHandler = $$props.swipeHandler);
    		if ("pos_axis" in $$props) pos_axis = $$props.pos_axis;
    		if ("page_axis" in $$props) page_axis = $$props.page_axis;
    		if ("axis" in $$props) axis = $$props.axis;
    		if ("longTouch" in $$props) longTouch = $$props.longTouch;
    		if ("last_axis_pos" in $$props) last_axis_pos = $$props.last_axis_pos;
    		if ("played" in $$props) played = $$props.played;
    		if ("run_interval" in $$props) $$invalidate(17, run_interval = $$props.run_interval);
    		if ("touch_active" in $$props) touch_active = $$props.touch_active;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*total_elements*/ 65536) {
    			$$invalidate(2, indicators = Array(total_elements));
    		}

    		if ($$self.$$.dirty[0] & /*autoplay, run_interval, delay*/ 134144) {
    			{
    				if (autoplay && !run_interval) {
    					$$invalidate(17, run_interval = setInterval(changeView, delay));
    				}

    				if (!autoplay && run_interval) {
    					clearInterval(run_interval);
    					$$invalidate(17, run_interval = false);
    				}
    			}
    		}
    	};

    	return [
    		showIndicators,
    		activeIndicator,
    		indicators,
    		swipeWrapper,
    		swipeHandler,
    		onMoveStart,
    		changeItem,
    		defaultIndex,
    		active_item,
    		transitionDuration,
    		autoplay,
    		delay,
    		is_vertical,
    		goTo,
    		prevItem,
    		nextItem,
    		total_elements,
    		run_interval,
    		$$scope,
    		slots,
    		div2_binding,
    		div3_binding,
    		click_handler
    	];
    }

    class Swipe extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$7,
    			create_fragment$7,
    			safe_not_equal,
    			{
    				transitionDuration: 9,
    				showIndicators: 0,
    				autoplay: 10,
    				delay: 11,
    				defaultIndex: 7,
    				active_item: 8,
    				is_vertical: 12,
    				goTo: 13,
    				prevItem: 14,
    				nextItem: 15
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Swipe",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get transitionDuration() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionDuration(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showIndicators() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showIndicators(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autoplay() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autoplay(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get delay() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set delay(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get defaultIndex() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set defaultIndex(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active_item() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active_item(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get is_vertical() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set is_vertical(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get goTo() {
    		return this.$$.ctx[13];
    	}

    	set goTo(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prevItem() {
    		return this.$$.ctx[14];
    	}

    	set prevItem(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nextItem() {
    		return this.$$.ctx[15];
    	}

    	set nextItem(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-swipe/src/SwipeItem.svelte generated by Svelte v3.38.2 */
    const file$3 = "node_modules/svelte-swipe/src/SwipeItem.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;
    	let div1_class_value;
    	let div1_resize_listener;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "swipeable-item-inner");
    			add_location(div0, file$3, 41, 2, 1099);
    			attr_dev(div1, "class", div1_class_value = "swipeable-item " + /*classes*/ ctx[1] + " " + (/*active*/ ctx[0] ? "is-active" : "") + " " + " svelte-1ks2opm");
    			attr_dev(div1, "style", /*style*/ ctx[2]);
    			add_render_callback(() => /*div1_elementresize_handler*/ ctx[9].call(div1));
    			add_location(div1, file$3, 40, 0, 984);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			/*div0_binding*/ ctx[8](div0);
    			div1_resize_listener = add_resize_listener(div1, /*div1_elementresize_handler*/ ctx[9].bind(div1));
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 64)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*classes, active*/ 3 && div1_class_value !== (div1_class_value = "swipeable-item " + /*classes*/ ctx[1] + " " + (/*active*/ ctx[0] ? "is-active" : "") + " " + " svelte-1ks2opm")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (!current || dirty & /*style*/ 4) {
    				attr_dev(div1, "style", /*style*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			/*div0_binding*/ ctx[8](null);
    			div1_resize_listener();
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
    	validate_slots("SwipeItem", slots, ['default']);
    	let { active = false } = $$props;
    	let { classes = "" } = $$props;
    	let { style = "" } = $$props;
    	let { allow_dynamic_height = false } = $$props;
    	let swipeItemInner = null;
    	let _height = 0;
    	const dispatch = createEventDispatcher();

    	function firehHeightChange() {
    		if (swipeItemInner) {
    			let { scrollHeight, clientHeight } = swipeItemInner;

    			dispatch("swipe_item_height_change", {
    				height: Math.max(scrollHeight, clientHeight)
    			});
    		}
    	}

    	onMount(() => {
    		setTimeout(
    			() => {
    				allow_dynamic_height && requestAnimationFrame(firehHeightChange);
    			},
    			100
    		);
    	});

    	const writable_props = ["active", "classes", "style", "allow_dynamic_height"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SwipeItem> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			swipeItemInner = $$value;
    			$$invalidate(4, swipeItemInner);
    		});
    	}

    	function div1_elementresize_handler() {
    		_height = this.clientHeight;
    		$$invalidate(3, _height);
    	}

    	$$self.$$set = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("classes" in $$props) $$invalidate(1, classes = $$props.classes);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    		if ("allow_dynamic_height" in $$props) $$invalidate(5, allow_dynamic_height = $$props.allow_dynamic_height);
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		createEventDispatcher,
    		active,
    		classes,
    		style,
    		allow_dynamic_height,
    		swipeItemInner,
    		_height,
    		dispatch,
    		firehHeightChange
    	});

    	$$self.$inject_state = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("classes" in $$props) $$invalidate(1, classes = $$props.classes);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    		if ("allow_dynamic_height" in $$props) $$invalidate(5, allow_dynamic_height = $$props.allow_dynamic_height);
    		if ("swipeItemInner" in $$props) $$invalidate(4, swipeItemInner = $$props.swipeItemInner);
    		if ("_height" in $$props) $$invalidate(3, _height = $$props._height);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*active, allow_dynamic_height, _height*/ 41) {
    			(allow_dynamic_height && active && _height && requestAnimationFrame(firehHeightChange));
    		}
    	};

    	return [
    		active,
    		classes,
    		style,
    		_height,
    		swipeItemInner,
    		allow_dynamic_height,
    		$$scope,
    		slots,
    		div0_binding,
    		div1_elementresize_handler
    	];
    }

    class SwipeItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			active: 0,
    			classes: 1,
    			style: 2,
    			allow_dynamic_height: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SwipeItem",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get active() {
    		throw new Error("<SwipeItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<SwipeItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<SwipeItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<SwipeItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<SwipeItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<SwipeItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get allow_dynamic_height() {
    		throw new Error("<SwipeItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set allow_dynamic_height(value) {
    		throw new Error("<SwipeItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    class Matrix {
      constructor(svg) {
        this.svg = svg || document.createElementNS("http://www.w3.org/2000/svg", "svg");

        this.vtm = this.createSVGMatrix();

        this.x = 0;
        this.y = 0;

        this.captureScale = 1;
      }

      clamp(scale, in_x, in_y, ratio) {
        let xx = (window.innerWidth - ratio.width) / 2;
        let yy = (window.innerHeight - ratio.height) / 2;

        let limit_max_right_formula = xx * scale + ratio.width * scale - window.innerWidth;

        let same_x = Math.min(this.vtm.e * 1.0, 0);
        let same_y = Math.min(this.vtm.f * 1.0, 0);

        let value1 = in_x > 0 ? same_x : -(xx * scale);
        let value2 = in_x > 0 ? same_x : -limit_max_right_formula;

        let limit_x_axis = this.vtm.e;
        limit_x_axis = Math.max(value2, this.vtm.e);
        limit_x_axis = Math.min(value1, limit_x_axis);

        let limit_max_bottom_formula = yy * scale + ratio.height * scale - window.innerHeight;
        let limit_max_top = in_y > 0 ? same_y : -(yy * scale);
        let limit_max_bottom = in_y > 0 ? same_y : -limit_max_bottom_formula;

        let limit_y_axis = this.vtm.f;
        limit_y_axis = Math.min(limit_max_top, limit_y_axis);
        limit_y_axis = Math.max(limit_y_axis, limit_max_bottom);

        this.vtm = this.createSVGMatrix().translate(limit_x_axis, limit_y_axis).scale(Math.max(this.vtm.a, 1));
      }

      createSVGMatrix() {
        return this.svg.createSVGMatrix()
      }

      move(x, y, in_x, in_y, ratio) {
        this.vtm = this.createSVGMatrix()
          .translate(this.x - x, this.y - y)
          .scale(this.vtm.a);

        this.clamp(this.vtm.a, in_x, in_y, ratio);
        return this.vtm
      }

      scale(xFactor, yFactor, origin, in_x, in_y, ratio, max, value, dir) {
        if ((value >= max || this.stop) && dir === 1) {
          this.stop = true;
          if (!this.deb) {
            this.captureScale = this.vtm.a;
            this.vtm = this.createSVGMatrix()
              .translate(origin.x, origin.y)
              .scale(max / this.captureScale)
              .translate(-origin.x, -origin.y)
              .translate(this.vtm.e, this.vtm.f)
              .scale(this.captureScale);

            this.deb = true;
          }
          return this.vtm
        } else {
          this.stop = false;
        }

        this.vtm = this.createSVGMatrix()
          .translate(origin.x, origin.y)
          .scale(xFactor, yFactor)
          .translate(-origin.x, -origin.y)
          .multiply(this.vtm);

        let pre_scale = Math.min(Math.max(1, this.vtm.a), max);

        this.clamp(pre_scale, in_x, in_y, ratio);

        return this.vtm
      }
    }

    class MultiTouchVelocity {
      constructor() {
        this.touchA = {
          clientX: 0,
          clientY: 0,
          t: 0,
          velocity: 1,
        };
        this.touchB = {
          clientX: 0,
          clientY: 0,
          t: 0,
          velocity: 1,
        };
      }
      down(touchA, touchB) {
        this.touchA = { clientX: touchA.clientX, clientY: touchA.clientY, t: Date.now(), velocity: 0 };
        this.touchB = { clientX: touchB.clientX, clientY: touchB.clientY, t: Date.now(), veloctiy: 0 };
      }
      calc(touch, ins) {
        var new_x = touch.clientX,
          new_y = touch.clientY,
          new_t = Date.now();

        var x_dist = new_x - ins.clientX,
          y_dist = new_y - ins.clientY,
          interval = new_t - ins.t;
        var velocity = Math.sqrt(x_dist * x_dist + y_dist * y_dist) / interval;
        ins.velocity = velocity;
        // update values:
        ins.clientX = new_x;
        ins.clientY = new_y;
        ins.t = new_t;
      }
      getVelocity(touchA, touchB) {
        this.calc(touchA, this.touchA);
        this.calc(touchB, this.touchB);
        return this.touchA.velocity + this.touchB.velocity
      }
    }

    function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
      var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

      return { width: srcWidth * ratio, height: srcHeight * ratio, ratio }
    }

    function getDistance(touchA, touchB) {
      return Math.hypot(touchA.pageX - touchB.pageX, touchA.pageY - touchB.pageY)
    }

    /* node_modules/svelte-zoom/src/index.svelte generated by Svelte v3.38.2 */
    const file$2 = "node_modules/svelte-zoom/src/index.svelte";

    function create_fragment$5(ctx) {
    	let img_1;
    	let mounted;
    	let dispose;
    	let img_1_levels = [{ alt: /*alt*/ ctx[0] }, { class: "c-svelteZoom" }, /*$$props*/ ctx[7]];
    	let img_1_data = {};

    	for (let i = 0; i < img_1_levels.length; i += 1) {
    		img_1_data = assign(img_1_data, img_1_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			img_1 = element("img");
    			set_attributes(img_1, img_1_data);
    			toggle_class(img_1, "c-svelteZoom--contain", /*contain*/ ctx[3]);
    			toggle_class(img_1, "c-svelteZoom--no-contain", !/*contain*/ ctx[3]);
    			toggle_class(img_1, "c-svelteZoom--transition", /*smooth*/ ctx[1]);
    			toggle_class(img_1, "c-svelteZoom--visible", /*contain*/ ctx[3]);
    			toggle_class(img_1, "c-svelteZoom--hidden", /*contain*/ ctx[3] === null);
    			toggle_class(img_1, "svelte-17i4z2s", true);
    			add_location(img_1, file$2, 40, 0, 759);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img_1, anchor);
    			/*img_1_binding*/ ctx[10](img_1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(img_1, "mousedown", /*mousedown*/ ctx[5], false, false, false),
    					listen_dev(img_1, "touchstart", /*touchstart*/ ctx[6], false, false, false),
    					listen_dev(img_1, "load", /*onLoad*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(img_1, img_1_data = get_spread_update(img_1_levels, [
    				dirty[0] & /*alt*/ 1 && { alt: /*alt*/ ctx[0] },
    				{ class: "c-svelteZoom" },
    				dirty[0] & /*$$props*/ 128 && /*$$props*/ ctx[7]
    			]));

    			toggle_class(img_1, "c-svelteZoom--contain", /*contain*/ ctx[3]);
    			toggle_class(img_1, "c-svelteZoom--no-contain", !/*contain*/ ctx[3]);
    			toggle_class(img_1, "c-svelteZoom--transition", /*smooth*/ ctx[1]);
    			toggle_class(img_1, "c-svelteZoom--visible", /*contain*/ ctx[3]);
    			toggle_class(img_1, "c-svelteZoom--hidden", /*contain*/ ctx[3] === null);
    			toggle_class(img_1, "svelte-17i4z2s", true);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img_1);
    			/*img_1_binding*/ ctx[10](null);
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
    	validate_slots("Src", slots, []);
    	let { alt } = $$props;
    	let smooth = true;
    	let touchScreen = false;
    	let xY = { initX: 0, initY: 0, newX: 0, newY: 0 };
    	let ratio, img;
    	let matrix;
    	let contain = null;
    	let velocity = new MultiTouchVelocity();
    	let lastTap = { time: 0, x: 0, y: 0 };

    	let scale = {
    		scaling: false,
    		x1: 0,
    		x2: 0,
    		y1: 0,
    		y2: 0,
    		lastHypo: 0,
    		originX: 0,
    		originY: 0,
    		value: 1,
    		max: 1
    	};

    	function fireDown(x, y) {
    		xY.initX = x;
    		xY.initY = y;
    		matrix.x = matrix.vtm.e;
    		matrix.y = matrix.vtm.f;
    	}

    	function fireMove(x, y) {
    		if (scale.scaling) return;
    		let in_x = (window.innerWidth - ratio.width * matrix.vtm.a) / 2;
    		let in_y = (window.innerHeight - ratio.height * matrix.vtm.a) / 2;
    		xY.newX = xY.initX - x;
    		xY.newY = xY.initY - y;
    		const mat = matrix.move(in_x >= 0 ? 0 : xY.newX, in_y >= 0 ? 0 : xY.newY, in_x, in_y, ratio);
    		$$invalidate(2, img.style.transform = `matrix(${mat.a},${mat.b},${mat.c},${mat.d},${mat.e}, ${mat.f})`, img);
    	}

    	function fireUp() {
    		matrix.x -= xY.newX;
    		matrix.y -= xY.newY;
    		scale.scaling = false;
    		scale.lastHypo = 0;
    		$$invalidate(1, smooth = true);
    	}

    	function fireScale(touchA, touchB) {
    		const xTouch = [Math.min(touchA.pageX, touchB.pageX), Math.max(touchA.pageX, touchB.pageX)];
    		const yTouch = [Math.min(touchA.pageY, touchB.pageY), Math.max(touchA.pageY, touchB.pageY)];
    		const W = xTouch[1] - xTouch[0];
    		const centerX = W / 2 + xTouch[0];
    		const H = yTouch[1] - yTouch[0];
    		const centerY = H / 2 + yTouch[0];
    		scale.originX = centerX;
    		scale.originY = centerY;
    		scale.lastHypo = Math.trunc(getDistance(touchA, touchB));
    		$$invalidate(1, smooth = false);
    	}

    	function fireTapScale(x, y) {
    		let scaleVtm = matrix.vtm.a;
    		let scale_value = scaleVtm > 1 ? scaleVtm - 1 : scale.max / 2.5;
    		let scale_factor = scaleVtm > 1 ? -1 : 1;
    		const xFactor = 1 + scale_value * scale_factor;
    		const yFactor = xFactor * window.innerHeight / window.innerWidth;
    		let in_x = (window.innerWidth - ratio.width * Math.max(xFactor * scaleVtm, 1)) / 2;
    		let in_y = (window.innerHeight - ratio.height * Math.max(xFactor * scaleVtm, 1)) / 2;

    		const origin = {
    			x: in_x > 0 ? window.innerWidth / 2 : x,
    			y: in_y > 0 ? window.innerHeight / 2 : y
    		};

    		const mat = matrix.scale(xFactor, yFactor, origin, in_x, in_y, ratio, scale.max, scale.value * xFactor, scale_factor);
    		scale.value = mat.d;
    		$$invalidate(2, img.style.transform = `translate(${mat.e}px, ${mat.f}px) scale(${mat.d})`, img);
    	}

    	function fireScaleMove(touchA, touchB, e) {
    		const hypo = getDistance(touchA, touchB);
    		let f = hypo / scale.lastHypo;
    		f = f >= 1 ? 1 : -1;
    		const ff = velocity.getVelocity(touchA, touchB) || 1;
    		const xFactor = 1 + 0.1 * ff * f;
    		const yFactor = xFactor * window.innerHeight / window.innerWidth;
    		let in_x = (window.innerWidth - ratio.width * matrix.vtm.a) / 2;
    		let in_y = (window.innerHeight - ratio.height * matrix.vtm.a) / 2;

    		const origin = {
    			x: in_x > 0 ? window.innerWidth / 2 : scale.originX,
    			y: in_y > 0 ? window.innerHeight / 2 : scale.originY
    		};

    		const mat = matrix.scale(xFactor, yFactor, origin, in_x, in_y, ratio, scale.max, scale.value * xFactor, f);
    		$$invalidate(2, img.style.transform = `translate(${mat.e}px, ${mat.f}px) scale(${mat.d})`, img);
    		scale.value = mat.d;
    		scale.lastHypo = hypo;
    		scale.scaling = true;
    	}

    	function fireManualZoom(dir) {
    		const xFactor = 1 + 0.2 * dir;
    		const yFactor = xFactor * window.innerHeight / window.innerWidth;
    		let in_x = (window.innerWidth - ratio.width * matrix.vtm.a) / 2;
    		let in_y = (window.innerHeight - ratio.height * matrix.vtm.a) / 2;

    		const origin = {
    			x: window.innerWidth / 2,
    			y: window.innerHeight / 2
    		};

    		const mat = matrix.scale(xFactor, yFactor, origin, in_x, in_y, ratio, scale.max, scale.value * xFactor, dir);
    		$$invalidate(2, img.style.transform = `translate(${mat.e}px,${mat.f}px) scale(${mat.d})`, img);
    		scale.value = mat.d;
    	}

    	const zoomIn = () => fireManualZoom(1);
    	const zoomOut = () => fireManualZoom(-1);

    	function onResize() {
    		onLoad();
    		fireDown(0, 0);
    		fireMove(0, 0);
    		fireUp();
    	}

    	function onWheel(e) {
    		e.preventDefault();
    		const dir = e.deltaY < 0 ? 1 : -1;
    		const xFactor = 1 + 0.1 * dir;
    		const yFactor = xFactor * window.innerHeight / window.innerWidth;
    		let in_x = (window.innerWidth - ratio.width * matrix.vtm.a) / 2;
    		let in_y = (window.innerHeight - ratio.height * matrix.vtm.a) / 2;

    		const origin = {
    			x: in_x > 0 ? window.innerWidth / 2 : e.pageX,
    			y: in_y > 0 ? window.innerHeight / 2 : e.pageY
    		};

    		const mat = matrix.scale(xFactor, yFactor, origin, in_x, in_y, ratio, scale.max, scale.value * xFactor, dir);
    		$$invalidate(2, img.style.transform = `translate(${mat.e}px,${mat.f}px) scale(${mat.d})`, img);
    		scale.value = mat.d;
    	}

    	function onLoad() {
    		const { naturalWidth, naturalHeight } = img;
    		$$invalidate(3, contain = naturalWidth > window.innerWidth || naturalHeight > window.innerHeight);
    		scale.max = Math.max(naturalWidth / window.innerWidth, 1);
    		ratio = calculateAspectRatioFit(naturalWidth, naturalHeight, window.innerWidth, window.innerHeight);
    	}

    	onMount(() => {
    		matrix = new Matrix();
    		window.addEventListener("wheel", onWheel, { passive: false });
    		window.addEventListener("resize", onResize);
    	});

    	function onTouchStart(e) {
    		touchScreen = true;
    		const isMultiTouch = e.touches.length === 2;
    		const [touchA, touchB] = e.touches;
    		scale.scaling = isMultiTouch;
    		$$invalidate(1, smooth = false);

    		if (isMultiTouch) {
    			fireScale(touchA, touchB);
    			velocity.down(touchA, touchB);
    		} else {
    			const { pageX, pageY } = touchA;
    			var now = new Date().getTime();

    			if (now - lastTap.time < 250 && Math.hypot(lastTap.current.x - pageX, lastTap.current.y - pageY) <= 20) {
    				$$invalidate(1, smooth = true);
    				fireTapScale(pageX, pageY);
    			} else {
    				fireDown(pageX, pageY);
    			}

    			lastTap = { time: now, x: pageX, y: pageY };
    		}

    		window.removeEventListener("touchmove", onTouchMove);
    		window.removeEventListener("touchend", onTouchEnd);
    		window.addEventListener("touchmove", onTouchMove);
    		window.addEventListener("touchend", onTouchEnd);
    	}

    	function onTouchMove(e) {
    		if (scale.scaling) {
    			const [touchA, touchB] = e.touches;
    			fireScaleMove(touchA, touchB);
    		} else {
    			fireMove(e.touches[0].pageX, e.touches[0].pageY);
    		}
    	}

    	function onTouchEnd(e) {
    		fireUp();
    		window.removeEventListener("touchmove", onTouchMove);
    		window.removeEventListener("touchend", onTouchEnd);
    		window.removeEventListener("touchcancel", onTouchEnd);
    	}

    	function onMouseDown({ clientX, clientY }) {
    		if (touchScreen) return;
    		fireDown(clientX, clientY);
    		$$invalidate(1, smooth = false);
    		window.addEventListener("mousemove", onMouseMove);
    		window.addEventListener("mouseup", onMouseUp);
    	}

    	function onMouseMove({ clientX, clientY }) {
    		fireMove(clientX, clientY);
    	}

    	function onMouseUp() {
    		window.removeEventListener("mousemove", onMouseMove);
    		fireUp();
    	}

    	const mousedown = onMouseDown;
    	const touchstart = onTouchStart;

    	function img_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			img = $$value;
    			$$invalidate(2, img);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(7, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("alt" in $$new_props) $$invalidate(0, alt = $$new_props.alt);
    	};

    	$$self.$capture_state = () => ({
    		alt,
    		Matrix,
    		MultiTouchVelocity,
    		calculateAspectRatioFit,
    		getDistance,
    		onMount,
    		smooth,
    		touchScreen,
    		xY,
    		ratio,
    		img,
    		matrix,
    		contain,
    		velocity,
    		lastTap,
    		scale,
    		fireDown,
    		fireMove,
    		fireUp,
    		fireScale,
    		fireTapScale,
    		fireScaleMove,
    		fireManualZoom,
    		zoomIn,
    		zoomOut,
    		onResize,
    		onWheel,
    		onLoad,
    		onTouchStart,
    		onTouchMove,
    		onTouchEnd,
    		onMouseDown,
    		onMouseMove,
    		onMouseUp,
    		mousedown,
    		touchstart
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(7, $$props = assign(assign({}, $$props), $$new_props));
    		if ("alt" in $$props) $$invalidate(0, alt = $$new_props.alt);
    		if ("smooth" in $$props) $$invalidate(1, smooth = $$new_props.smooth);
    		if ("touchScreen" in $$props) touchScreen = $$new_props.touchScreen;
    		if ("xY" in $$props) xY = $$new_props.xY;
    		if ("ratio" in $$props) ratio = $$new_props.ratio;
    		if ("img" in $$props) $$invalidate(2, img = $$new_props.img);
    		if ("matrix" in $$props) matrix = $$new_props.matrix;
    		if ("contain" in $$props) $$invalidate(3, contain = $$new_props.contain);
    		if ("velocity" in $$props) velocity = $$new_props.velocity;
    		if ("lastTap" in $$props) lastTap = $$new_props.lastTap;
    		if ("scale" in $$props) scale = $$new_props.scale;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);

    	return [
    		alt,
    		smooth,
    		img,
    		contain,
    		onLoad,
    		mousedown,
    		touchstart,
    		$$props,
    		zoomIn,
    		zoomOut,
    		img_1_binding
    	];
    }

    class Src extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { alt: 0, zoomIn: 8, zoomOut: 9 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Src",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*alt*/ ctx[0] === undefined && !("alt" in props)) {
    			console.warn("<Src> was created without expected prop 'alt'");
    		}
    	}

    	get alt() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set alt(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zoomIn() {
    		return this.$$.ctx[8];
    	}

    	set zoomIn(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zoomOut() {
    		return this.$$.ctx[9];
    	}

    	set zoomOut(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/ImageSwipe/ImageSwipe.svelte generated by Svelte v3.38.2 */
    const file$1 = "src/components/ImageSwipe/ImageSwipe.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[12] = i;
    	return child_ctx;
    }

    // (31:12) {#each images as image, i}
    function create_each_block_1$1(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[5](/*i*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t = space();
    			if (img.src !== (img_src_value = /*image*/ ctx[8])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "mh-100 mw-100");
    			attr_dev(img, "alt", "");
    			add_location(img, file$1, 35, 16, 1005);
    			attr_dev(div, "class", "img d-flex align-items-center justify-content-center m-1 svelte-1f08pnx");
    			toggle_class(div, "img-selected", /*active_item*/ ctx[2] == /*i*/ ctx[12]);
    			add_location(div, file$1, 31, 14, 833);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*images*/ 1 && img.src !== (img_src_value = /*image*/ ctx[8])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*active_item*/ 4) {
    				toggle_class(div, "img-selected", /*active_item*/ ctx[2] == /*i*/ ctx[12]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(31:12) {#each images as image, i}",
    		ctx
    	});

    	return block;
    }

    // (61:8) <SwipeItem>
    function create_default_slot_1(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t = space();
    			if (img.src !== (img_src_value = /*image*/ ctx[8])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "m-auto h-auto mw-100 mh-100");
    			add_location(img, file$1, 65, 12, 1841);
    			attr_dev(div, "class", "d-flex justify-content-center align-items-center p-5 h-100");
    			add_location(div, file$1, 61, 10, 1648);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*images*/ 1 && img.src !== (img_src_value = /*image*/ ctx[8])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(61:8) <SwipeItem>",
    		ctx
    	});

    	return block;
    }

    // (60:6) {#each images as image}
    function create_each_block$1(ctx) {
    	let swipeitem;
    	let current;

    	swipeitem = new SwipeItem({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(swipeitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(swipeitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const swipeitem_changes = {};

    			if (dirty & /*$$scope, images*/ 8193) {
    				swipeitem_changes.$$scope = { dirty, ctx };
    			}

    			swipeitem.$set(swipeitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(swipeitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(swipeitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(swipeitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(60:6) {#each images as image}",
    		ctx
    	});

    	return block;
    }

    // (59:4) <Swipe bind:this={swipe} bind:active_item>
    function create_default_slot(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*images*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

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
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*images*/ 1) {
    				each_value = /*images*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(59:4) <Swipe bind:this={swipe} bind:active_item>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let main;
    	let div6;
    	let div5;
    	let div4;
    	let div0;
    	let button;
    	let i;
    	let t0;
    	let div2;
    	let div1;
    	let t1;
    	let div3;
    	let h5;
    	let span;
    	let t2_value = /*active_item*/ ctx[2] + 1 + "";
    	let t2;
    	let t3;
    	let t4_value = /*images*/ ctx[0].length + "";
    	let t4;
    	let t5;
    	let div7;
    	let swipe_1;
    	let updating_active_item;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*images*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	function swipe_1_active_item_binding(value) {
    		/*swipe_1_active_item_binding*/ ctx[7](value);
    	}

    	let swipe_1_props = {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	if (/*active_item*/ ctx[2] !== void 0) {
    		swipe_1_props.active_item = /*active_item*/ ctx[2];
    	}

    	swipe_1 = new Swipe({ props: swipe_1_props, $$inline: true });
    	/*swipe_1_binding*/ ctx[6](swipe_1);
    	binding_callbacks.push(() => bind(swipe_1, "active_item", swipe_1_active_item_binding));

    	const block = {
    		c: function create() {
    			main = element("main");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			button = element("button");
    			i = element("i");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			div3 = element("div");
    			h5 = element("h5");
    			span = element("span");
    			t2 = text(t2_value);
    			t3 = text("/");
    			t4 = text(t4_value);
    			t5 = space();
    			div7 = element("div");
    			create_component(swipe_1.$$.fragment);
    			attr_dev(i, "class", "fas fa-chevron-left");
    			add_location(i, file$1, 25, 35, 627);
    			attr_dev(button, "class", "btn btn-floating btn-lg btn-dark");
    			add_location(button, file$1, 23, 10, 531);
    			attr_dev(div0, "class", "p-1");
    			add_location(div0, file$1, 22, 8, 503);
    			attr_dev(div1, "class", "d-flex justify-content-center p-1");
    			add_location(div1, file$1, 29, 10, 732);
    			attr_dev(div2, "class", "p-1");
    			add_location(div2, file$1, 28, 8, 704);
    			attr_dev(span, "class", "badge bg-dark text-light");
    			add_location(span, file$1, 49, 12, 1342);
    			add_location(h5, file$1, 48, 10, 1325);
    			attr_dev(div3, "class", "p-1");
    			add_location(div3, file$1, 47, 8, 1297);
    			attr_dev(div4, "class", "d-flex justify-content-between align-items-center h-100");
    			add_location(div4, file$1, 21, 6, 425);
    			attr_dev(div5, "class", "container-fluid");
    			add_location(div5, file$1, 20, 4, 389);
    			attr_dev(div6, "class", "header h-25 svelte-1f08pnx");
    			add_location(div6, file$1, 19, 2, 359);
    			attr_dev(div7, "class", "swipe h-75");
    			add_location(div7, file$1, 57, 2, 1516);
    			attr_dev(main, "class", "svelte-1f08pnx");
    			add_location(main, file$1, 18, 0, 350);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, button);
    			append_dev(button, i);
    			append_dev(div4, t0);
    			append_dev(div4, div2);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, h5);
    			append_dev(h5, span);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			append_dev(span, t4);
    			append_dev(main, t5);
    			append_dev(main, div7);
    			mount_component(swipe_1, div7, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*active_item, images, swipe*/ 7) {
    				each_value_1 = /*images*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if ((!current || dirty & /*active_item*/ 4) && t2_value !== (t2_value = /*active_item*/ ctx[2] + 1 + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty & /*images*/ 1) && t4_value !== (t4_value = /*images*/ ctx[0].length + "")) set_data_dev(t4, t4_value);
    			const swipe_1_changes = {};

    			if (dirty & /*$$scope, images*/ 8193) {
    				swipe_1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_active_item && dirty & /*active_item*/ 4) {
    				updating_active_item = true;
    				swipe_1_changes.active_item = /*active_item*/ ctx[2];
    				add_flush_callback(() => updating_active_item = false);
    			}

    			swipe_1.$set(swipe_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(swipe_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(swipe_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			/*swipe_1_binding*/ ctx[6](null);
    			destroy_component(swipe_1);
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
    	validate_slots("ImageSwipe", slots, []);
    	let { index = 0 } = $$props;
    	let { images = [] } = $$props;

    	onMount(async () => {
    		await tick();
    		swipe.goTo(index);
    	});

    	let swipe;
    	let active_item = 0;
    	const writable_props = ["index", "images"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImageSwipe> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => pop();

    	const click_handler_1 = i => {
    		swipe.goTo(i);
    	};

    	function swipe_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			swipe = $$value;
    			$$invalidate(1, swipe);
    		});
    	}

    	function swipe_1_active_item_binding(value) {
    		active_item = value;
    		$$invalidate(2, active_item);
    	}

    	$$self.$$set = $$props => {
    		if ("index" in $$props) $$invalidate(3, index = $$props.index);
    		if ("images" in $$props) $$invalidate(0, images = $$props.images);
    	};

    	$$self.$capture_state = () => ({
    		Swipe,
    		SwipeItem,
    		pop,
    		onMount,
    		tick,
    		Zoom: Src,
    		index,
    		images,
    		swipe,
    		active_item
    	});

    	$$self.$inject_state = $$props => {
    		if ("index" in $$props) $$invalidate(3, index = $$props.index);
    		if ("images" in $$props) $$invalidate(0, images = $$props.images);
    		if ("swipe" in $$props) $$invalidate(1, swipe = $$props.swipe);
    		if ("active_item" in $$props) $$invalidate(2, active_item = $$props.active_item);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		images,
    		swipe,
    		active_item,
    		index,
    		click_handler,
    		click_handler_1,
    		swipe_1_binding,
    		swipe_1_active_item_binding
    	];
    }

    class ImageSwipe extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { index: 3, images: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageSwipe",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get index() {
    		throw new Error("<ImageSwipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<ImageSwipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get images() {
    		throw new Error("<ImageSwipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set images(value) {
    		throw new Error("<ImageSwipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/ImageSwipe/ImageNoSwipe.svelte generated by Svelte v3.38.2 */
    const file = "src/components/ImageSwipe/ImageNoSwipe.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (21:8) {#each images as image, i}
    function create_each_block_1(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[3](/*i*/ ctx[8]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t = space();
    			if (img.src !== (img_src_value = /*image*/ ctx[6])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "mh-100 mw-100");
    			attr_dev(img, "alt", "");
    			add_location(img, file, 25, 12, 814);
    			attr_dev(div, "class", "img d-flex align-items-center justify-content-center m-1 svelte-15aqrpd");
    			toggle_class(div, "img-selected", /*index*/ ctx[0] == /*i*/ ctx[8]);
    			add_location(div, file, 21, 10, 664);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*images*/ 2 && img.src !== (img_src_value = /*image*/ ctx[6])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*index*/ 1) {
    				toggle_class(div, "img-selected", /*index*/ ctx[0] == /*i*/ ctx[8]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(21:8) {#each images as image, i}",
    		ctx
    	});

    	return block;
    }

    // (49:8) {#each images as image, i}
    function create_each_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*image*/ ctx[6])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "m-auto h-auto mw-100 mh-100 py-5");
    			toggle_class(img, "d-none", /*index*/ ctx[0] != /*i*/ ctx[8]);
    			add_location(img, file, 49, 10, 1412);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*images*/ 2 && img.src !== (img_src_value = /*image*/ ctx[6])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*index*/ 1) {
    				toggle_class(img, "d-none", /*index*/ ctx[0] != /*i*/ ctx[8]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(49:8) {#each images as image, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let div4;
    	let div0;
    	let button0;
    	let i0;
    	let t0;
    	let div2;
    	let div1;
    	let t1;
    	let div3;
    	let h5;
    	let span;
    	let t2_value = Number(/*index*/ ctx[0]) + 1 + "";
    	let t2;
    	let t3;
    	let t4_value = /*images*/ ctx[1].length + "";
    	let t4;
    	let t5;
    	let div7;
    	let div6;
    	let div5;
    	let t6;
    	let div10;
    	let div8;
    	let button1;
    	let i1;
    	let t7;
    	let t8;
    	let div9;
    	let button2;
    	let t9;
    	let i2;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*images*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*images*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			div4 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			i0 = element("i");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();
    			div3 = element("div");
    			h5 = element("h5");
    			span = element("span");
    			t2 = text(t2_value);
    			t3 = text("/");
    			t4 = text(t4_value);
    			t5 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			div10 = element("div");
    			div8 = element("div");
    			button1 = element("button");
    			i1 = element("i");
    			t7 = text(" 이전 이미지");
    			t8 = space();
    			div9 = element("div");
    			button2 = element("button");
    			t9 = text("다음 이미지 ");
    			i2 = element("i");
    			attr_dev(i0, "class", "fas fa-chevron-left");
    			add_location(i0, file, 15, 9, 482);
    			attr_dev(button0, "class", "btn btn-floating btn-lg btn-dark");
    			add_location(button0, file, 14, 6, 401);
    			attr_dev(div0, "class", "p-1");
    			add_location(div0, file, 13, 4, 377);
    			attr_dev(div1, "class", "d-flex justify-content-center p-1");
    			add_location(div1, file, 19, 6, 571);
    			attr_dev(div2, "class", "p-1");
    			add_location(div2, file, 18, 4, 547);
    			attr_dev(span, "class", "badge bg-dark text-light");
    			add_location(span, file, 39, 8, 1091);
    			add_location(h5, file, 38, 6, 1078);
    			attr_dev(div3, "class", "p-1");
    			add_location(div3, file, 37, 4, 1054);
    			attr_dev(div4, "class", "fixed-top p-3 d-flex justify-content-between align-items-center");
    			add_location(div4, file, 12, 2, 295);
    			attr_dev(div5, "class", "d-flex justify-content-center align-items-center p-5 h-100");
    			add_location(div5, file, 47, 6, 1294);
    			attr_dev(div6, "class", "w-100 h-100");
    			add_location(div6, file, 46, 4, 1262);
    			attr_dev(div7, "class", "swipe h-100 py-5");
    			add_location(div7, file, 45, 2, 1227);
    			attr_dev(i1, "class", "fas fa-arrow-left");
    			add_location(i1, file, 66, 11, 1848);
    			attr_dev(button1, "class", "btn btn-dark btn-lg");
    			toggle_class(button1, "d-none", /*index*/ ctx[0] == 0);
    			add_location(button1, file, 61, 6, 1699);
    			add_location(div8, file, 60, 4, 1687);
    			attr_dev(i2, "class", "fas fa-arrow-right");
    			add_location(i2, file, 75, 18, 2118);
    			attr_dev(button2, "class", "btn btn-dark btn-lg");
    			toggle_class(button2, "d-none", /*index*/ ctx[0] == /*images*/ ctx[1].length - 1);
    			add_location(button2, file, 70, 6, 1930);
    			add_location(div9, file, 69, 4, 1918);
    			attr_dev(div10, "class", "w-100 d-flex justify-content-between fixed-bottom p-3");
    			add_location(div10, file, 59, 2, 1615);
    			attr_dev(main, "class", "svelte-15aqrpd");
    			add_location(main, file, 11, 0, 286);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div4);
    			append_dev(div4, div0);
    			append_dev(div0, button0);
    			append_dev(button0, i0);
    			append_dev(div4, t0);
    			append_dev(div4, div2);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div1, null);
    			}

    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, h5);
    			append_dev(h5, span);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			append_dev(span, t4);
    			append_dev(main, t5);
    			append_dev(main, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div5, null);
    			}

    			append_dev(main, t6);
    			append_dev(main, div10);
    			append_dev(div10, div8);
    			append_dev(div8, button1);
    			append_dev(button1, i1);
    			append_dev(button1, t7);
    			append_dev(div10, t8);
    			append_dev(div10, div9);
    			append_dev(div9, button2);
    			append_dev(button2, t9);
    			append_dev(button2, i2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[4], false, false, false),
    					listen_dev(button2, "click", /*click_handler_3*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*index, images*/ 3) {
    				each_value_1 = /*images*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*index*/ 1 && t2_value !== (t2_value = Number(/*index*/ ctx[0]) + 1 + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*images*/ 2 && t4_value !== (t4_value = /*images*/ ctx[1].length + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*images, index*/ 3) {
    				each_value = /*images*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div5, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*index*/ 1) {
    				toggle_class(button1, "d-none", /*index*/ ctx[0] == 0);
    			}

    			if (dirty & /*index, images*/ 3) {
    				toggle_class(button2, "d-none", /*index*/ ctx[0] == /*images*/ ctx[1].length - 1);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots("ImageNoSwipe", slots, []);
    	let { index = 0 } = $$props;
    	let { images = [] } = $$props;
    	const writable_props = ["index", "images"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImageNoSwipe> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => pop();

    	const click_handler_1 = i => {
    		$$invalidate(0, index = i);
    	};

    	const click_handler_2 = () => {
    		if (index > 0) $$invalidate(0, index--, index);
    	};

    	const click_handler_3 = () => {
    		if (index < images.length - 1) $$invalidate(0, index++, index);
    	};

    	$$self.$$set = $$props => {
    		if ("index" in $$props) $$invalidate(0, index = $$props.index);
    		if ("images" in $$props) $$invalidate(1, images = $$props.images);
    	};

    	$$self.$capture_state = () => ({
    		Swipe,
    		SwipeItem,
    		pop,
    		onMount,
    		tick,
    		Zoom: Src,
    		slide,
    		index,
    		images
    	});

    	$$self.$inject_state = $$props => {
    		if ("index" in $$props) $$invalidate(0, index = $$props.index);
    		if ("images" in $$props) $$invalidate(1, images = $$props.images);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		index,
    		images,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class ImageNoSwipe extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { index: 0, images: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageNoSwipe",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get index() {
    		throw new Error("<ImageNoSwipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<ImageNoSwipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get images() {
    		throw new Error("<ImageNoSwipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set images(value) {
    		throw new Error("<ImageNoSwipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/ImageViewer.svelte generated by Svelte v3.38.2 */

    // (1:0) <script>   import { afterUpdate, beforeUpdate, onMount, tick }
    function create_catch_block(ctx) {
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
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>   import { afterUpdate, beforeUpdate, onMount, tick }",
    		ctx
    	});

    	return block;
    }

    // (28:0) {:then images}
    function create_then_block(ctx) {
    	let imagenoswipe;
    	let updating_index;
    	let current;

    	function imagenoswipe_index_binding(value) {
    		/*imagenoswipe_index_binding*/ ctx[3](value);
    	}

    	let imagenoswipe_props = { images: /*images*/ ctx[5] };

    	if (/*index*/ ctx[0] !== void 0) {
    		imagenoswipe_props.index = /*index*/ ctx[0];
    	}

    	imagenoswipe = new ImageNoSwipe({
    			props: imagenoswipe_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(imagenoswipe, "index", imagenoswipe_index_binding));

    	const block = {
    		c: function create() {
    			create_component(imagenoswipe.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(imagenoswipe, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const imagenoswipe_changes = {};

    			if (!updating_index && dirty & /*index*/ 1) {
    				updating_index = true;
    				imagenoswipe_changes.index = /*index*/ ctx[0];
    				add_flush_callback(() => updating_index = false);
    			}

    			imagenoswipe.$set(imagenoswipe_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imagenoswipe.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imagenoswipe.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(imagenoswipe, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(28:0) {:then images}",
    		ctx
    	});

    	return block;
    }

    // (26:20)    loading ... {:then images}
    function create_pending_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("loading ...");
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
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(26:20)    loading ... {:then images}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let await_block_anchor;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 5,
    		blocks: [,,,]
    	};

    	handle_promise(/*getImages*/ ctx[1](), info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
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
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ImageViewer", slots, []);
    	let { params = {} } = $$props;
    	var requestNo = params.request_no;
    	var index = params.index;

    	// onMount(async () => {
    	//   images = data.data.image_url.split(",");
    	// });
    	const getImages = async () => {
    		const res = await fetch(`${apiHost}/get_request?request_no=${requestNo}`);
    		const data = await res.json();
    		return data.data.image_url.split(",");
    	};

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImageViewer> was created with unknown prop '${key}'`);
    	});

    	function imagenoswipe_index_binding(value) {
    		index = value;
    		$$invalidate(0, index);
    	}

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(2, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		beforeUpdate,
    		onMount,
    		tick,
    		apiHost,
    		Swipe,
    		SwipeItem,
    		pop,
    		ImageSwipe,
    		ImageNoSwipe,
    		Alert,
    		params,
    		requestNo,
    		index,
    		getImages
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(2, params = $$props.params);
    		if ("requestNo" in $$props) requestNo = $$props.requestNo;
    		if ("index" in $$props) $$invalidate(0, index = $$props.index);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [index, getImages, params, imagenoswipe_index_binding];
    }

    class ImageViewer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { params: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageViewer",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get params() {
    		throw new Error("<ImageViewer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<ImageViewer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/FW7.svelte generated by Svelte v3.38.2 */

    function create_fragment$1(ctx) {
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FW7", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FW7> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class FW7 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FW7",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const routes = {
        '/': Home,
        '/request': RequestForm,
        '/viewer/:request_no': Viewer,
        // '/list/:status': List,
        '/list': List,
        '/test': Test,
        '/image/:request_no/:index?': ImageViewer,
        '/fw7/:page': FW7,
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
