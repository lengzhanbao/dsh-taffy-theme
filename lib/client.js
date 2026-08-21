window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-taffy-theme",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		//#region src/state/adapter.ts
		const SUCCESS_HOLD_MS = 1200;
		const ERROR_HOLD_MS = 1600;
		let lastState = "idle";
		let lastChangeAt = 0;
		let successTimer;
		let errorTimer;
		function resetStateAdapter() {
			lastState = "idle";
			lastChangeAt = 0;
			if (successTimer) clearTimeout(successTimer);
			if (errorTimer) clearTimeout(errorTimer);
			successTimer = void 0;
			errorTimer = void 0;
		}
		function scheduleFlash(next, holdMs, onState) {
			const timerRef = next === "success" ? "successTimer" : "errorTimer";
			const existing = next === "success" ? successTimer : errorTimer;
			if (existing) clearTimeout(existing);
			onState(next);
			const timer = setTimeout(() => onState("idle"), holdMs);
			if (timerRef === "successTimer") successTimer = timer;
			else errorTimer = timer;
		}
		function mapDomSignals(signals, onState) {
			if (signals.success) {
				scheduleFlash("success", SUCCESS_HOLD_MS, onState);
				lastState = "success";
				return lastState;
			}
			if (signals.error) {
				scheduleFlash("error", ERROR_HOLD_MS, onState);
				lastState = "error";
				return lastState;
			}
			let next = "idle";
			if (!signals.activeConversation) next = "idle";
			else if (signals.streaming) next = "streaming";
			else if (signals.hasToolCall) next = "tool-calling";
			else if (signals.composerPhase === "thinking" || signals.composerPhase === "reasoning") next = "thinking";
			else next = "idle";
			const now = Date.now();
			if (next !== lastState && now - lastChangeAt > 80) {
				lastState = next;
				lastChangeAt = now;
				onState(next);
			}
			return lastState;
		}
		//#endregion
		//#region src/assets/validate.ts
		const COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))$/;
		function isSafeCssColor(value) {
			const trimmed = value.trim();
			if (!trimmed || trimmed.length > 64) return false;
			if (/[;{}]/.test(trimmed)) return false;
			return COLOR_RE.test(trimmed);
		}
		function sanitizeColorField(value) {
			if (typeof value !== "string") return void 0;
			return isSafeCssColor(value) ? value.trim() : void 0;
		}
		function isAllowedImageProtocol(url) {
			if (url.startsWith("data:image/")) return true;
			if (url.startsWith("blob:")) return true;
			if (url.startsWith("/plugins/")) return true;
			if (/^https?:\/\/127\.0\.0\.1(?::\d+)?\//.test(url)) return true;
			if (/^https?:\/\/localhost(?::\d+)?\//.test(url)) return true;
			return false;
		}
		//#endregion
		//#region src/client/inline-restore.ts
		function snapshotInlineStyles(element, keys) {
			return keys.map((key) => ({
				key,
				value: element.style.getPropertyValue(key),
				priority: element.style.getPropertyPriority(key)
			}));
		}
		function restoreInlineStyles(element, snapshot) {
			for (const entry of snapshot) if (entry.value === "") element.style.removeProperty(entry.key);
			else element.style.setProperty(entry.key, entry.value, entry.priority);
		}
		//#endregion
		//#region src/theme/user-theme.ts
		const PRESETS = {
			"taffy-candy": {
				primary: "#f29bc2",
				secondary: "#493b50",
				accent: "#e7b957",
				background: "#fff7f1",
				surface: "#fffdfb",
				text: "#141018",
				success: "#e7b957",
				warning: "#e7b957",
				error: "#c43c3c"
			},
			"taffy-night": {
				primary: "#f2a5c8",
				secondary: "#bfaeeb",
				accent: "#e7be62",
				background: "#211b32",
				surface: "#2a2340",
				text: "#fff3e8",
				success: "#e7be62",
				warning: "#e7be62",
				error: "#c43c3c"
			},
			"taffy-mint": {
				primary: "#f29bc2",
				secondary: "#91d5e8",
				accent: "#e7b957",
				background: "#f6fbfc",
				surface: "#ffffff",
				text: "#141018",
				success: "#e7b957",
				warning: "#e7b957",
				error: "#c43c3c"
			}
		};
		const TAFFY_TOKEN_KEYS = [
			"--ds-taffy-pink",
			"--ds-taffy-charcoal",
			"--ds-taffy-gold",
			"--ds-taffy-ribbon",
			"--ds-taffy-text",
			"--taffy-pink",
			"--taffy-gold"
		];
		function resolveThemeTokens(colors) {
			const base = colors.preset === "custom" ? PRESETS["taffy-candy"] : PRESETS[colors.preset];
			return {
				primary: sanitizeColorField(colors.primary) ?? base.primary,
				secondary: sanitizeColorField(colors.secondary) ?? base.secondary,
				accent: sanitizeColorField(colors.accent) ?? base.accent,
				background: sanitizeColorField(colors.background) ?? base.background,
				surface: sanitizeColorField(colors.surface) ?? base.surface,
				text: sanitizeColorField(colors.text) ?? base.text,
				success: sanitizeColorField(colors.success) ?? base.success,
				warning: sanitizeColorField(colors.warning) ?? base.warning,
				error: sanitizeColorField(colors.error) ?? base.error
			};
		}
		function snapshotThemeTokens(root) {
			return snapshotInlineStyles(root, TAFFY_TOKEN_KEYS);
		}
		function applyThemeTokens(root, tokens, options) {
			root.style.setProperty("--ds-taffy-pink", tokens.primary);
			root.style.setProperty("--ds-taffy-charcoal", tokens.secondary);
			root.style.setProperty("--ds-taffy-gold", tokens.accent);
			root.style.setProperty("--ds-taffy-ribbon", tokens.error);
			root.style.setProperty("--taffy-pink", tokens.primary);
			root.style.setProperty("--taffy-gold", tokens.accent);
			if (options?.pinText) root.style.setProperty("--ds-taffy-text", tokens.text);
			else root.style.removeProperty("--ds-taffy-text");
		}
		function restoreThemeTokens(root, snapshot) {
			restoreInlineStyles(root, snapshot);
		}
		//#endregion
		//#region src/theme/time-theme.ts
		const PHASE_BOUNDARIES = [
			6,
			12,
			18,
			22
		];
		function resolveTimePhase(date = /* @__PURE__ */ new Date()) {
			const hour = date.getHours();
			if (hour >= 6 && hour < 12) return "morning";
			if (hour >= 12 && hour < 18) return "afternoon";
			if (hour >= 18 && hour < 22) return "evening";
			return "night";
		}
		function msUntilNextPhaseBoundary(date = /* @__PURE__ */ new Date()) {
			const hour = date.getHours();
			const nextBoundary = PHASE_BOUNDARIES.find((boundary) => boundary > hour);
			const next = new Date(date);
			if (nextBoundary === void 0) {
				next.setDate(next.getDate() + 1);
				next.setHours(PHASE_BOUNDARIES[0], 0, 0, 0);
			} else next.setHours(nextBoundary, 0, 0, 0);
			return Math.max(1e3, next.getTime() - date.getTime());
		}
		function startTimePhaseTicker(onPhase) {
			let lastPhase = resolveTimePhase();
			let timer = 0;
			onPhase(lastPhase);
			const tick = () => {
				const phase = resolveTimePhase();
				if (phase !== lastPhase) {
					lastPhase = phase;
					onPhase(phase);
				}
				timer = window.setTimeout(tick, msUntilNextPhaseBoundary());
			};
			timer = window.setTimeout(tick, msUntilNextPhaseBoundary());
			return () => window.clearTimeout(timer);
		}
		//#endregion
		//#region ../../src/deepseek-harness/vendor/cosmokit/lib/index.js
		/** Return true when a value is `null` or `undefined`. */
		function isNullable(value) {
			return value === null || value === void 0;
		}
		/** Return true for non-array object values. */
		function isPlainObject(data) {
			return data && typeof data === "object" && !Array.isArray(data);
		}
		/** Filter object entries and return a new object. */
		function filterKeys(object, filter) {
			return Object.fromEntries(Object.entries(object).filter(([key, value]) => filter(key, value)));
		}
		/** Map object values while preserving the original key set. */
		function mapValues(object, transform) {
			return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
		}
		/** Pick selected keys from an object, optionally including `undefined` values. */
		function pick(source, keys, forced) {
			if (!keys) return { ...source };
			const result = {};
			for (const key of keys) if (forced || source[key] !== void 0) result[key] = source[key];
			return result;
		}
		/** Test values using `instanceof` with a `toStringTag` fallback. */
		function is(type, value) {
			if (arguments.length === 1) return (value) => is(type, value);
			return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
		}
		function isArrayBufferLike(value) {
			return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
		}
		function isArrayBufferSource(value) {
			return isArrayBufferLike(value) || ArrayBuffer.isView(value);
		}
		/** Binary source detection and base64/hex conversion helpers. */
		var Binary;
		(function(Binary) {
			Binary.is = isArrayBufferLike;
			Binary.isSource = isArrayBufferSource;
			function fromSource(source) {
				if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
				else return source;
			}
			Binary.fromSource = fromSource;
			function toBase64(source) {
				source = fromSource(source);
				if (typeof Buffer !== "undefined") return Buffer.from(source).toString("base64");
				let binary = "";
				const bytes = new Uint8Array(source);
				for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
				return btoa(binary);
			}
			Binary.toBase64 = toBase64;
			function fromBase64(source) {
				if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
				return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
			}
			Binary.fromBase64 = fromBase64;
			function toHex(source) {
				source = fromSource(source);
				if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
				return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
			}
			Binary.toHex = toHex;
			function fromHex(source) {
				if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
				const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
				const buffer = [];
				for (let i = 0; i < hex.length; i += 2) buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
				return Uint8Array.from(buffer).buffer;
			}
			Binary.fromHex = fromHex;
		})(Binary || (Binary = {}));
		Binary.fromBase64;
		Binary.toBase64;
		Binary.fromHex;
		Binary.toHex;
		/** Deep-clone common JavaScript values while preserving prototypes and cycles. */
		function clone(source, refs = /* @__PURE__ */ new Map()) {
			if (!source || typeof source !== "object") return source;
			if (is("Date", source)) return new Date(source.valueOf());
			if (is("RegExp", source)) return new RegExp(source.source, source.flags);
			if (isArrayBufferLike(source)) return source.slice(0);
			if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
			const cached = refs.get(source);
			if (cached) return cached;
			if (Array.isArray(source)) {
				const result = [];
				refs.set(source, result);
				source.forEach((value, index) => {
					result[index] = Reflect.apply(clone, null, [value, refs]);
				});
				return result;
			}
			const result = Object.create(Object.getPrototypeOf(source));
			refs.set(source, result);
			for (const key of Reflect.ownKeys(source)) {
				const descriptor = { ...Reflect.getOwnPropertyDescriptor(source, key) };
				if ("value" in descriptor) descriptor.value = Reflect.apply(clone, null, [descriptor.value, refs]);
				Reflect.defineProperty(result, key, descriptor);
			}
			return result;
		}
		/** Deeply compare arrays, dates, regexps, buffers, and plain object fields. */
		function deepEqual(a, b, strict) {
			if (a === b) return true;
			if (!strict && isNullable(a) && isNullable(b)) return true;
			if (typeof a !== typeof b) return false;
			if (typeof a !== "object") return false;
			if (!a || !b) return false;
			function check(test, then) {
				return test(a) ? test(b) ? then(a, b) : false : test(b) ? false : void 0;
			}
			return check(Array.isArray, (a, b) => a.length === b.length && a.every((item, index) => deepEqual(item, b[index]))) ?? check(is("Date"), (a, b) => a.valueOf() === b.valueOf()) ?? check(is("RegExp"), (a, b) => a.source === b.source && a.flags === b.flags) ?? check(isArrayBufferLike, (a, b) => {
				if (a.byteLength !== b.byteLength) return false;
				const viewA = new Uint8Array(a);
				const viewB = new Uint8Array(b);
				for (let i = 0; i < viewA.length; i++) if (viewA[i] !== viewB[i]) return false;
				return true;
			}) ?? Object.keys({
				...a,
				...b
			}).every((key) => deepEqual(a[key], b[key], strict));
		}
		/** Time constants plus parsing and formatting helpers. */
		var Time;
		(function(Time) {
			Time.millisecond = 1;
			Time.second = 1e3;
			Time.minute = Time.second * 60;
			Time.hour = Time.minute * 60;
			Time.day = Time.hour * 24;
			Time.week = Time.day * 7;
			let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
			function setTimezoneOffset(offset) {
				timezoneOffset = offset;
			}
			Time.setTimezoneOffset = setTimezoneOffset;
			function getTimezoneOffset() {
				return timezoneOffset;
			}
			Time.getTimezoneOffset = getTimezoneOffset;
			function getDateNumber(date = /* @__PURE__ */ new Date(), offset) {
				if (typeof date === "number") date = new Date(date);
				if (offset === void 0) offset = timezoneOffset;
				return Math.floor((date.valueOf() / Time.minute - offset) / 1440);
			}
			Time.getDateNumber = getDateNumber;
			function fromDateNumber(value, offset) {
				const date = new Date(value * Time.day);
				if (offset === void 0) offset = timezoneOffset;
				return new Date(+date + offset * Time.minute);
			}
			Time.fromDateNumber = fromDateNumber;
			const numeric = /\d+(?:\.\d+)?/.source;
			const timeRegExp = new RegExp(`^${[
				"w(?:eek(?:s)?)?",
				"d(?:ay(?:s)?)?",
				"h(?:our(?:s)?)?",
				"m(?:in(?:ute)?(?:s)?)?",
				"s(?:ec(?:ond)?(?:s)?)?"
			].map((unit) => `(${numeric}${unit})?`).join("")}$`);
			function parseTime(source) {
				const capture = timeRegExp.exec(source);
				if (!capture) return 0;
				return (parseFloat(capture[1]) * Time.week || 0) + (parseFloat(capture[2]) * Time.day || 0) + (parseFloat(capture[3]) * Time.hour || 0) + (parseFloat(capture[4]) * Time.minute || 0) + (parseFloat(capture[5]) * Time.second || 0);
			}
			Time.parseTime = parseTime;
			function parseDate(date) {
				const parsed = parseTime(date);
				if (parsed) date = Date.now() + parsed;
				else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date}`;
				else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date}`;
				return date ? new Date(date) : /* @__PURE__ */ new Date();
			}
			Time.parseDate = parseDate;
			function format(ms) {
				const abs = Math.abs(ms);
				if (abs >= Time.day - Time.hour / 2) return Math.round(ms / Time.day) + "d";
				else if (abs >= Time.hour - Time.minute / 2) return Math.round(ms / Time.hour) + "h";
				else if (abs >= Time.minute - Time.second / 2) return Math.round(ms / Time.minute) + "m";
				else if (abs >= Time.second) return Math.round(ms / Time.second) + "s";
				return ms + "ms";
			}
			Time.format = format;
			function toDigits(source, length = 2) {
				return source.toString().padStart(length, "0");
			}
			Time.toDigits = toDigits;
			function template(template, time = /* @__PURE__ */ new Date()) {
				return template.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
			}
			Time.template = template;
		})(Time || (Time = {}));
		//#endregion
		//#region ../../src/deepseek-harness/vendor/schemastery/lib/index.mjs
		const kSchema = Symbol.for("schemastery");
		const kValidationError = Symbol.for("ValidationError");
		globalThis.__schemastery_index__ ??= 0;
		globalThis.__schemastery_refs__ = void 0;
		var ValidationError = class extends TypeError {
			options;
			name = "ValidationError";
			constructor(message, options) {
				let prefix = "$";
				for (const segment of options.path || []) if (typeof segment === "string") prefix += "." + segment;
				else if (typeof segment === "number") prefix += "[" + segment + "]";
				else if (typeof segment === "symbol") prefix += `[Symbol(${segment.toString()})]`;
				if (prefix.startsWith(".")) prefix = prefix.slice(1);
				super((prefix === "$" ? "" : `${prefix} `) + message);
				this.options = options;
			}
			static is(error) {
				return !!error?.[kValidationError];
			}
		};
		Object.defineProperty(ValidationError.prototype, kValidationError, { value: true });
		const Schema = function(options) {
			const schema = function(data, options = {}) {
				return Schema.resolve(data, schema, options)[0];
			};
			if (options.refs) {
				const refs = mapValues(options.refs, (options) => new Schema(options));
				const getRef = (uid) => refs[uid];
				for (const key in refs) {
					const options = refs[key];
					options.sKey = getRef(options.sKey);
					options.inner = getRef(options.inner);
					options.list = options.list && options.list.map(getRef);
					options.dict = options.dict && mapValues(options.dict, getRef);
				}
				return refs[options.uid];
			}
			Object.assign(schema, options);
			if (typeof schema.callback === "string") try {
				schema.callback = new Function("return " + schema.callback)();
			} catch {}
			Object.defineProperty(schema, "uid", { value: globalThis.__schemastery_index__++ });
			Object.setPrototypeOf(schema, Schema.prototype);
			schema.meta ||= {};
			schema.toString = schema.toString.bind(schema);
			return schema;
		};
		Schema.prototype = Object.create(Function.prototype);
		Schema.prototype[kSchema] = true;
		Object.defineProperty(Schema.prototype, "~standard", { get() {
			return {
				version: 1,
				vendor: "schemastery",
				validate: (value) => {
					try {
						return { value: Schema.resolve(value, this, {})[0] };
					} catch (error) {
						if (ValidationError.is(error)) return { issues: [{
							message: error.message,
							path: error.options.path
						}] };
						throw error;
					}
				}
			};
		} });
		Schema.ValidationError = ValidationError;
		Schema.prototype.toJSON = function toJSON() {
			if (globalThis.__schemastery_refs__) {
				globalThis.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
				return this.uid;
			}
			globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
			globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
			const result = {
				uid: this.uid,
				refs: globalThis.__schemastery_refs__
			};
			globalThis.__schemastery_refs__ = void 0;
			return result;
		};
		Schema.prototype.set = function set(key, value) {
			this.dict[key] = value;
			return this;
		};
		Schema.prototype.push = function push(value) {
			this.list.push(value);
			return this;
		};
		function mergeDesc(original, messages) {
			const result = typeof original === "string" ? { "": original } : { ...original };
			for (const locale in messages) {
				const value = messages[locale];
				if (value?.$description || value?.$desc) result[locale] = value.$description || value.$desc;
				else if (typeof value === "string") result[locale] = value;
			}
			return result;
		}
		function getInner(value) {
			return value?.$value ?? value?.$inner;
		}
		function extractKeys(data) {
			return filterKeys(data ?? {}, (key) => !key.startsWith("$"));
		}
		Schema.prototype.i18n = function i18n(messages) {
			const schema = Schema(this);
			const desc = mergeDesc(schema.meta.description, messages);
			if (Object.keys(desc).length) schema.meta.description = desc;
			if (schema.dict) schema.dict = mapValues(schema.dict, (inner, key) => {
				return inner.i18n(mapValues(messages, (data) => getInner(data)?.[key] ?? data?.[key]));
			});
			if (schema.list) schema.list = schema.list.map((inner, index) => {
				return inner.i18n(mapValues(messages, (data = {}) => {
					if (Array.isArray(getInner(data))) return getInner(data)[index];
					if (Array.isArray(data)) return data[index];
					return extractKeys(data);
				}));
			});
			if (schema.inner) schema.inner = schema.inner.i18n(mapValues(messages, (data) => {
				if (getInner(data)) return getInner(data);
				return extractKeys(data);
			}));
			if (schema.sKey) schema.sKey = schema.sKey.i18n(mapValues(messages, (data) => data?.$key));
			return schema;
		};
		Schema.prototype.extra = function extra(key, value) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		};
		for (const key of [
			"required",
			"disabled",
			"collapse",
			"hidden",
			"loose"
		]) Object.assign(Schema.prototype, { [key](value = true) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		} });
		Schema.prototype.deprecated = function deprecated() {
			const schema = Schema(this);
			schema.meta.badges ||= [];
			schema.meta.badges.push({
				text: "deprecated",
				type: "danger"
			});
			return schema;
		};
		Schema.prototype.experimental = function experimental() {
			const schema = Schema(this);
			schema.meta.badges ||= [];
			schema.meta.badges.push({
				text: "experimental",
				type: "warning"
			});
			return schema;
		};
		Schema.prototype.pattern = function pattern(regexp) {
			const schema = Schema(this);
			const pattern = pick(regexp, ["source", "flags"]);
			schema.meta = {
				...schema.meta,
				pattern
			};
			return schema;
		};
		Schema.prototype.simplify = function simplify(value) {
			if (deepEqual(value, this.meta.default, this.type === "dict")) return null;
			if (isNullable(value)) return value;
			if (this.type === "object" || this.type === "dict") {
				const result = {};
				for (const key in value) {
					const item = (this.type === "object" ? this.dict[key] : this.inner)?.simplify(value[key]);
					if (this.type === "dict" || !isNullable(item)) result[key] = item;
				}
				if (deepEqual(result, this.meta.default, this.type === "dict")) return null;
				return result;
			} else if (this.type === "array" || this.type === "tuple") {
				const result = [];
				value.forEach((value, index) => {
					const schema = this.type === "array" ? this.inner : this.list[index];
					const item = schema ? schema.simplify(value) : value;
					result.push(item);
				});
				return result;
			} else if (this.type === "intersect") {
				const result = {};
				for (const item of this.list) Object.assign(result, item.simplify(value));
				return result;
			} else if (this.type === "union") for (const schema of this.list) try {
				Schema.resolve(value, schema, {});
				return schema.simplify(value);
			} catch {}
			return value;
		};
		Schema.prototype.toString = function toString(inline) {
			return formatters[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
		};
		Schema.prototype.role = function role(role, extra) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				role,
				extra
			};
			return schema;
		};
		for (const key of [
			"default",
			"link",
			"comment",
			"description",
			"max",
			"min",
			"step"
		]) Object.assign(Schema.prototype, { [key](value) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		} });
		const resolvers = {};
		Schema.extend = function extend(type, resolve) {
			resolvers[type] = resolve;
		};
		Schema.resolve = function resolve(data, schema, options = {}, strict = false) {
			if (!schema) return [data];
			if (options.ignore?.(data, schema)) return [data];
			if (isNullable(data) && schema.type !== "lazy") {
				if (schema.meta.required) throw new ValidationError(`missing required value`, options);
				let current = schema;
				let fallback = schema.meta.default;
				while (current?.type === "intersect" && isNullable(fallback)) {
					current = current.list[0];
					fallback = current?.meta.default;
				}
				if (isNullable(fallback)) return [data];
				data = clone(fallback);
			}
			const callback = resolvers[schema.type];
			if (!callback) throw new ValidationError(`unsupported type "${schema.type}"`, options);
			try {
				return callback(data, schema, options, strict);
			} catch (error) {
				if (!schema.meta.loose) throw error;
				return [schema.meta.default];
			}
		};
		Schema.from = function from(source) {
			if (isNullable(source)) return Schema.any();
			else if ([
				"string",
				"number",
				"boolean"
			].includes(typeof source)) return Schema.const(source).required();
			else if (source[kSchema]) return source;
			else if (typeof source === "function") switch (source) {
				case String: return Schema.string().required();
				case Number: return Schema.number().required();
				case Boolean: return Schema.boolean().required();
				case Function: return Schema.function().required();
				default: return Schema.is(source).required();
			}
			else throw new TypeError(`cannot infer schema from ${source}`);
		};
		Schema.lazy = function lazy(builder) {
			const toJSON = () => {
				if (!schema.inner[kSchema]) {
					schema.inner = schema.builder();
					schema.inner.meta = {
						...schema.meta,
						...schema.inner.meta
					};
				}
				return schema.inner.toJSON();
			};
			const schema = new Schema({
				type: "lazy",
				builder,
				inner: { toJSON }
			});
			return schema;
		};
		Schema.natural = function natural() {
			return Schema.number().step(1).min(0);
		};
		Schema.percent = function percent() {
			return Schema.number().step(.01).min(0).max(1).role("slider");
		};
		Schema.date = function date() {
			return Schema.union([Schema.is(Date), Schema.transform(Schema.string().role("datetime"), (value, options) => {
				const date = new Date(value);
				if (isNaN(+date)) throw new ValidationError(`invalid date "${value}"`, options);
				return date;
			}, true)]);
		};
		Schema.regExp = function regExp(flag = "") {
			return Schema.union([Schema.is(RegExp), Schema.transform(Schema.string().role("regexp", { flag }), (value, options) => {
				try {
					return new RegExp(value, flag);
				} catch (e) {
					throw new ValidationError(e.message, options);
				}
			}, true)]);
		};
		Schema.arrayBuffer = function arrayBuffer(encoding) {
			return Schema.union([
				Schema.is(ArrayBuffer),
				Schema.is(SharedArrayBuffer),
				Schema.transform(Schema.any(), (value, options) => {
					if (Binary.isSource(value)) return Binary.fromSource(value);
					throw new ValidationError(`expected ArrayBufferSource but got ${value}`, options);
				}, true),
				...encoding ? [Schema.transform(Schema.string(), (value, options) => {
					try {
						return encoding === "base64" ? Binary.fromBase64(value) : Binary.fromHex(value);
					} catch (e) {
						throw new ValidationError(e.message, options);
					}
				}, true)] : []
			]);
		};
		Schema.extend("lazy", (data, schema, options, strict) => {
			if (!schema.inner[kSchema]) {
				schema.inner = schema.builder();
				schema.inner.meta = {
					...schema.meta,
					...schema.inner.meta
				};
			}
			return Schema.resolve(data, schema.inner, options, strict);
		});
		Schema.extend("any", (data) => {
			return [data];
		});
		Schema.extend("never", (data, _, options) => {
			throw new ValidationError(`expected nullable but got ${data}`, options);
		});
		Schema.extend("const", (data, { value }, options) => {
			if (deepEqual(data, value)) return [value];
			throw new ValidationError(`expected ${value} but got ${data}`, options);
		});
		function checkWithinRange(data, meta, description, options, skipMin = false) {
			const { max = Infinity, min = -Infinity } = meta;
			if (data > max) throw new ValidationError(`expected ${description} <= ${max} but got ${data}`, options);
			if (data < min && !skipMin) throw new ValidationError(`expected ${description} >= ${min} but got ${data}`, options);
		}
		Schema.extend("string", (data, { meta }, options) => {
			if (typeof data !== "string") throw new ValidationError(`expected string but got ${data}`, options);
			if (meta.pattern) {
				const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
				if (!regexp.test(data)) throw new ValidationError(`expect string to match regexp ${regexp}`, options);
			}
			checkWithinRange(data.length, meta, "string length", options);
			return [data];
		});
		function decimalShift(data, digits) {
			const str = data.toString();
			if (str.includes("e")) return data * Math.pow(10, digits);
			const index = str.indexOf(".");
			if (index === -1) return data * Math.pow(10, digits);
			const frac = str.slice(index + 1);
			const integer = str.slice(0, index);
			if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
			return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
		}
		function isMultipleOf(data, min, step) {
			step = Math.abs(step);
			if (!/^\d+\.\d+$/.test(step.toString())) return (data - min) % step === 0;
			const index = step.toString().indexOf(".");
			const digits = step.toString().slice(index + 1).length;
			return Math.abs(decimalShift(data, digits) - decimalShift(min, digits)) % decimalShift(step, digits) === 0;
		}
		Schema.extend("number", (data, { meta }, options) => {
			if (typeof data !== "number") throw new ValidationError(`expected number but got ${data}`, options);
			checkWithinRange(data, meta, "number", options);
			const { step } = meta;
			if (step && !isMultipleOf(data, meta.min ?? 0, step)) throw new ValidationError(`expected number multiple of ${step} but got ${data}`, options);
			return [data];
		});
		Schema.extend("boolean", (data, _, options) => {
			if (typeof data === "boolean") return [data];
			throw new ValidationError(`expected boolean but got ${data}`, options);
		});
		Schema.extend("bitset", (data, { bits, meta }, options) => {
			let value = 0, keys = [];
			if (typeof data === "number") {
				value = data;
				for (const key in bits) if (data & bits[key]) keys.push(key);
			} else if (Array.isArray(data)) {
				keys = data;
				for (const key of keys) {
					if (typeof key !== "string") throw new ValidationError(`expected string but got ${key}`, options);
					if (key in bits) value |= bits[key];
				}
			} else throw new ValidationError(`expected number or array but got ${data}`, options);
			if (value === meta.default) return [value];
			return [value, keys];
		});
		Schema.extend("function", (data, _, options) => {
			if (typeof data === "function") return [data];
			throw new ValidationError(`expected function but got ${data}`, options);
		});
		Schema.extend("is", (data, { constructor }, options) => {
			if (typeof constructor === "function") {
				if (data instanceof constructor) return [data];
				throw new ValidationError(`expected ${constructor.name} but got ${data}`, options);
			} else {
				if (isNullable(data)) throw new ValidationError(`expected ${constructor} but got ${data}`, options);
				let prototype = Object.getPrototypeOf(data);
				while (prototype) {
					if (prototype.constructor?.name === constructor) return [data];
					prototype = Object.getPrototypeOf(prototype);
				}
				throw new ValidationError(`expected ${constructor} but got ${data}`, options);
			}
		});
		function property(data, key, schema, options) {
			try {
				const [value, adapted] = Schema.resolve(data[key], schema, {
					...options,
					path: [...options.path || [], key]
				});
				if (adapted !== void 0) data[key] = adapted;
				return value;
			} catch (e) {
				if (!options?.autofix) throw e;
				delete data[key];
				return schema.meta.default;
			}
		}
		Schema.extend("array", (data, { inner, meta }, options) => {
			if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
			checkWithinRange(data.length, meta, "array length", options, !isNullable(inner.meta.default));
			return [data.map((_, index) => property(data, index, inner, options))];
		});
		Schema.extend("dict", (data, { inner, sKey }, options, strict) => {
			if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
			const result = {};
			for (const key in data) {
				let rKey;
				try {
					rKey = Schema.resolve(key, sKey, options)[0];
				} catch (error) {
					if (strict) continue;
					throw error;
				}
				result[rKey] = property(data, key, inner, options);
				data[rKey] = data[key];
				if (key !== rKey) delete data[key];
			}
			return [result];
		});
		Schema.extend("tuple", (data, { list }, options, strict) => {
			if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
			const result = list.map((inner, index) => property(data, index, inner, options));
			if (strict) return [result];
			result.push(...data.slice(list.length));
			return [result];
		});
		function merge(result, data) {
			for (const key in data) {
				if (key in result) continue;
				result[key] = data[key];
			}
		}
		Schema.extend("object", (data, { dict }, options, strict) => {
			if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
			const result = {};
			for (const key in dict) {
				const value = property(data, key, dict[key], options);
				if (!isNullable(value) || key in data) result[key] = value;
			}
			if (!strict) merge(result, data);
			return [result];
		});
		Schema.extend("union", (data, { list, toString }, options, strict) => {
			const messages = [];
			for (const inner of list) try {
				return Schema.resolve(data, inner, options, strict);
			} catch (error) {
				messages.push(error);
			}
			throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
		});
		Schema.extend("intersect", (data, { list, toString }, options, strict) => {
			if (!list.length) return [data];
			let result;
			for (const inner of list) {
				const value = Schema.resolve(data, inner, options, true)[0];
				if (isNullable(value)) continue;
				if (isNullable(result)) result = value;
				else if (typeof result !== typeof value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
				else if (typeof value === "object") merge(result ??= {}, value);
				else if (result !== value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
			}
			if (!strict && isPlainObject(data)) merge(result, data);
			return [result];
		});
		Schema.extend("transform", (data, { inner, callback, preserve }, options) => {
			const [result, adapted = data] = Schema.resolve(data, inner, options, true);
			if (preserve) return [callback(result)];
			else return [callback(result), callback(adapted)];
		});
		const formatters = {};
		function defineMethod(name, keys, format) {
			formatters[name] = format;
			Object.assign(Schema, { [name](...args) {
				const schema = new Schema({ type: name });
				keys.forEach((key, index) => {
					switch (key) {
						case "sKey":
							schema.sKey = args[index] ?? Schema.string();
							break;
						case "inner":
							schema.inner = Schema.from(args[index]);
							break;
						case "list":
							schema.list = args[index].map(Schema.from);
							break;
						case "dict":
							schema.dict = mapValues(args[index], Schema.from);
							break;
						case "bits":
							schema.bits = {};
							for (const key in args[index]) {
								if (typeof args[index][key] !== "number") continue;
								schema.bits[key] = args[index][key];
							}
							break;
						case "callback": {
							const callback = schema.callback = args[index];
							callback["toJSON"] ||= () => callback.toString();
							break;
						}
						case "constructor": {
							const constructor = schema.constructor = args[index];
							if (typeof constructor === "function") constructor["toJSON"] ||= () => constructor["name"];
							break;
						}
						default: schema[key] = args[index];
					}
				});
				if (name === "object" || name === "dict") schema.meta.default = {};
				else if (name === "array" || name === "tuple") schema.meta.default = [];
				else if (name === "bitset") schema.meta.default = 0;
				return schema;
			} });
		}
		defineMethod("is", ["constructor"], ({ constructor }) => {
			if (typeof constructor === "function") return constructor.name;
			else return constructor;
		});
		defineMethod("any", [], () => "any");
		defineMethod("never", [], () => "never");
		defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
		defineMethod("string", [], () => "string");
		defineMethod("number", [], () => "number");
		defineMethod("boolean", [], () => "boolean");
		defineMethod("bitset", ["bits"], () => "bitset");
		defineMethod("function", [], () => "function");
		defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
		defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
		defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
		defineMethod("object", ["dict"], ({ dict }) => {
			if (Object.keys(dict).length === 0) return "{}";
			return `{ ${Object.entries(dict).map(([key, inner]) => {
				return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
			}).join(", ")} }`;
		});
		defineMethod("union", ["list"], ({ list }, inline) => {
			const result = list.map(({ toString: format }) => format()).join(" | ");
			return inline ? `(${result})` : result;
		});
		defineMethod("intersect", ["list"], ({ list }) => {
			return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
		});
		defineMethod("transform", [
			"inner",
			"callback",
			"preserve"
		], ({ inner }, isInner) => inner.toString(isInner));
		Schema.object({});
		const colorPreset = Schema.union([
			Schema.const("taffy-candy"),
			Schema.const("taffy-night"),
			Schema.const("taffy-mint"),
			Schema.const("custom")
		]).default("taffy-candy");
		const dynamicIntensity = Schema.union([
			Schema.const("low"),
			Schema.const("standard"),
			Schema.const("high")
		]).default("standard");
		const motion = Schema.union([Schema.const("off"), Schema.const("standard")]).default("standard");
		const TaffyColorConfigSchema = Schema.object({
			preset: colorPreset,
			primary: Schema.string(),
			secondary: Schema.string(),
			accent: Schema.string(),
			background: Schema.string(),
			surface: Schema.string(),
			text: Schema.string(),
			success: Schema.string(),
			warning: Schema.string(),
			error: Schema.string(),
			dynamicEnabled: Schema.boolean().default(true),
			dynamicIntensity
		});
		const TaffySettingsSchema = Schema.object({
			schemaVersion: Schema.const(1).default(1),
			enabled: Schema.boolean().default(true),
			displayName: Schema.string().default("永雏塔菲"),
			subtitle: Schema.string().default("王牌侦探发明家喵"),
			avatar: Schema.union([Schema.const("default"), Schema.string()]).default("default"),
			portrait: Schema.union([
				Schema.const("default"),
				Schema.const("off"),
				Schema.string()
			]).default("default"),
			timePhaseEnabled: Schema.boolean().default(true),
			stateColorEnabled: Schema.boolean().default(true),
			motion,
			reducedMotion: Schema.boolean().default(false),
			veilOpacity: Schema.number().min(0).max(100).default(10),
			acrylicPercent: Schema.number().min(0).max(100).default(70),
			frameOpacity: Schema.number().min(0).max(100).default(85),
			panelOpacity: Schema.number().min(0).max(100).default(82),
			characterOpacity: Schema.number().min(0).max(100).default(100),
			showLeftCharacter: Schema.boolean().default(true),
			showRightCharacter: Schema.boolean().default(true),
			showMascot: Schema.boolean().default(true),
			colors: TaffyColorConfigSchema
		});
		function parseTaffySettings(value) {
			const resolved = TaffySettingsSchema(value && typeof value === "object" ? value : {});
			return {
				schemaVersion: 1,
				enabled: resolved.enabled,
				displayName: resolved.displayName,
				subtitle: resolved.subtitle,
				avatar: resolved.avatar,
				portrait: resolved.portrait,
				timePhaseEnabled: resolved.timePhaseEnabled,
				stateColorEnabled: resolved.stateColorEnabled,
				motion: resolved.motion,
				reducedMotion: resolved.reducedMotion,
				veilOpacity: resolved.veilOpacity,
				acrylicPercent: resolved.acrylicPercent,
				frameOpacity: resolved.frameOpacity,
				panelOpacity: resolved.panelOpacity,
				characterOpacity: resolved.characterOpacity,
				showLeftCharacter: resolved.showLeftCharacter,
				showRightCharacter: resolved.showRightCharacter,
				showMascot: resolved.showMascot,
				colors: {
					preset: resolved.colors.preset,
					primary: resolved.colors.primary,
					secondary: resolved.colors.secondary,
					accent: resolved.colors.accent,
					background: resolved.colors.background,
					surface: resolved.colors.surface,
					text: resolved.colors.text,
					success: resolved.colors.success,
					warning: resolved.colors.warning,
					error: resolved.colors.error,
					dynamicEnabled: resolved.colors.dynamicEnabled,
					dynamicIntensity: resolved.colors.dynamicIntensity
				}
			};
		}
		const DEFAULT_SETTINGS = parseTaffySettings({});
		//#endregion
		//#region src/client/settings-store.ts
		const STORAGE_KEY = "dsh-taffy-theme:v1";
		const SETTINGS_CHANGE_EVENT = "dsh-taffy-theme:settings-change";
		const LEGACY_VEILS = [
			"thin",
			"standard",
			"thick"
		];
		function isLegacyVeil(value) {
			return typeof value === "string" && LEGACY_VEILS.includes(value);
		}
		function percentFromLegacyVeil(veil) {
			if (veil === "thin") return 8;
			if (veil === "thick") return 18;
			return 12;
		}
		function veilFromOpacity(percent) {
			if (percent <= 9) return "thin";
			if (percent >= 16) return "thick";
			return "standard";
		}
		function veilBucket(settings) {
			return veilFromOpacity(settings.veilOpacity);
		}
		function migrateStoredSettings(raw) {
			if (!raw || typeof raw !== "object") return {};
			const input = { ...raw };
			const colors = { ...typeof input.colors === "object" && input.colors ? input.colors : {} };
			if (input.preset !== void 0 && colors.preset === void 0) colors.preset = input.preset;
			if (input.dynamicEnabled !== void 0 && colors.dynamicEnabled === void 0) colors.dynamicEnabled = input.dynamicEnabled;
			if (input.dynamicIntensity !== void 0 && colors.dynamicIntensity === void 0) colors.dynamicIntensity = input.dynamicIntensity;
			input.colors = colors;
			delete input.preset;
			delete input.dynamicEnabled;
			delete input.dynamicIntensity;
			if (input.veilOpacity == null) {
				const legacy = input.backgroundVeil ?? input.veilStrength;
				if (isLegacyVeil(legacy)) input.veilOpacity = percentFromLegacyVeil(legacy);
			}
			delete input.veilStrength;
			delete input.backgroundVeil;
			return input;
		}
		function loadSettings() {
			try {
				const raw = localStorage.getItem(STORAGE_KEY);
				if (!raw) return { ...DEFAULT_SETTINGS };
				return parseTaffySettings(migrateStoredSettings(JSON.parse(raw)));
			} catch {
				return { ...DEFAULT_SETTINGS };
			}
		}
		function saveSettings(next) {
			const clean = parseTaffySettings(next);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
			window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: clean }));
		}
		function subscribeSettings(onChange) {
			const handler = () => onChange(loadSettings());
			window.addEventListener("storage", handler);
			window.addEventListener(SETTINGS_CHANGE_EVENT, handler);
			return () => {
				window.removeEventListener("storage", handler);
				window.removeEventListener(SETTINGS_CHANGE_EVENT, handler);
			};
		}
		//#endregion
		//#region src/client/theme-css.ts
		const tokensCss = "/* Taffy tokens live on body. Official --dsw-* stay on native DSH panes only. */\r\n\r\nbody[data-dsh-taffy-theme] {\r\n  --ds-taffy-cream: #fff7f1;\r\n  --ds-taffy-cream-deep: #ffe8f0;\r\n  --ds-taffy-pink: #f29bc2;\r\n  --ds-taffy-pink-soft: #ffd8e7;\r\n  --ds-taffy-gold: #e7b957;\r\n  --ds-taffy-gold-deep: #c9a227;\r\n  --ds-taffy-charcoal: #493b50;\r\n  --ds-taffy-ribbon: #c43c3c;\r\n  --ds-taffy-lens: #91d5e8;\r\n  --ds-taffy-lavender: #b9a7e8;\r\n  --ds-taffy-text: #141018;\r\n  --ds-taffy-text-on-dark: #fff3e8;\r\n  --taffy-text-halo:\r\n    0 0 0.6px rgba(255, 255, 255, 0.95),\r\n    0 1px 0 rgba(255, 247, 241, 0.92),\r\n    0 0 8px rgba(255, 247, 241, 0.62);\r\n  --ds-taffy-border: rgba(73, 59, 80, 0.14);\r\n  --taffy-q-face: none;\r\n  --taffy-q-send: none;\r\n  --taffy-q-settings: none;\r\n  --taffy-q-brand: none;\r\n  --taffy-q-brand-right: none;\r\n  --taffy-q-new: none;\r\n  --taffy-q-command: none;\r\n  --taffy-q-stop: none;\r\n  --taffy-veil-strength: 0.12;\r\n\r\n  --ds-agent-idle: var(--ds-taffy-pink);\r\n  --ds-agent-thinking: var(--ds-taffy-lavender);\r\n  --ds-agent-tool: var(--ds-taffy-lens);\r\n  --ds-agent-streaming: var(--ds-taffy-pink-soft);\r\n  --ds-agent-success: var(--ds-taffy-gold);\r\n  --ds-agent-error: var(--ds-taffy-ribbon);\r\n\r\n  --taffy-sidebar-width: 280px;\r\n  --taffy-accent: var(--ds-taffy-pink);\r\n  --taffy-glow: rgba(242, 155, 194, 0.28);\r\n  --taffy-hairline: color-mix(in srgb, var(--ds-taffy-pink) 35%, transparent);\r\n  --taffy-motion-scale: 1;\r\n  --taffy-motion-duration: 1;\r\n  --taffy-veil: var(--ds-taffy-cream);\r\n  --taffy-font: \"M PLUS Rounded 1c\", Nunito, Inter, \"Segoe UI\", \"Noto Sans SC\", \"PingFang SC\", system-ui, sans-serif;\r\n  --taffy-mono: \"JetBrains Mono\", ui-monospace, \"Cascadia Mono\", Consolas, monospace;\r\n  --taffy-pink: var(--ds-taffy-pink);\r\n  --taffy-pink-deep: #dc6f9e;\r\n  --taffy-ink: var(--ds-taffy-text);\r\n  --taffy-muted: #817486;\r\n  --taffy-blue: var(--ds-taffy-lens);\r\n  --taffy-radius-sm: 8px;\r\n  --taffy-radius-md: 12px;\r\n  --taffy-radius-lg: 16px;\r\n  --taffy-frame-inset: 8px;\r\n  --taffy-frame-opacity: 0.85;\r\n  --taffy-panel-opacity: 82;\r\n  --taffy-plate-art: linear-gradient(\r\n    90deg,\r\n    rgba(255, 214, 232, 0.7),\r\n    rgba(255, 247, 241, 0.42) 50%,\r\n    rgba(255, 214, 232, 0.58)\r\n  );\r\n  --taffy-settings-frame-art: var(--taffy-plate-art);\r\n  --taffy-character-opacity: 1;\r\n  --taffy-veil-opacity: var(--taffy-veil-strength);\r\n  --taffy-acrylic-percent: 70;\r\n  --taffy-conversation-left: 0px;\r\n  --taffy-conversation-top: 0px;\r\n  --taffy-conversation-width: 0px;\r\n  --taffy-conversation-height: 0px;\r\n  --taffy-conversation-content-left: 0px;\r\n  --taffy-conversation-content-width: 0px;\r\n  --taffy-conversation-viewport-top: 0px;\r\n  --taffy-conversation-viewport-height: 0px;\r\n  --taffy-content-left: 0px;\r\n  --taffy-content-width: 0px;\r\n  --taffy-viewport-top: 0px;\r\n  --taffy-viewport-height: 0px;\r\n  --taffy-composer-top: 0px;\r\n  --taffy-composer-height: 0px;\r\n  --taffy-acrylic-bg: color-mix(in srgb, rgb(255, 250, 247) calc(var(--taffy-acrylic-percent) * 1%), transparent);\r\n  --taffy-acrylic-bg-strong: color-mix(in srgb, rgb(255, 250, 247) calc((var(--taffy-acrylic-percent) + 12) * 1%), transparent);\r\n  --taffy-acrylic-bg-soft: color-mix(in srgb, rgb(255, 250, 247) calc((var(--taffy-acrylic-percent) - 15) * 1%), transparent);\r\n  --taffy-acrylic-border: rgba(242, 155, 194, 0.25);\r\n  --taffy-acrylic-hairline: rgba(242, 155, 194, 0.22);\r\n  --taffy-acrylic-shadow: rgba(73, 59, 80, 0.12);\r\n  --taffy-acrylic-blur: 14px;\r\n  --taffy-acrylic-saturation: 1.05;\r\n  --taffy-acrylic-light: color-mix(in srgb, rgb(255, 250, 247) calc(var(--taffy-panel-opacity) * 1%), transparent);\r\n  --taffy-acrylic-dark: color-mix(in srgb, rgb(36, 29, 52) calc(var(--taffy-panel-opacity) * 1%), transparent);\r\n  --taffy-border-light: rgba(242, 155, 194, 0.34);\r\n  --taffy-border-dark: rgba(255, 220, 240, 0.2);\r\n  --taffy-highlight: rgba(255, 255, 255, 0.5);\r\n  --taffy-shadow: 0 12px 32px rgba(73, 59, 80, 0.12);\r\n\r\n  background-color: transparent;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-mint'] {\r\n  --ds-taffy-cream: #f6fbfc;\r\n  --ds-taffy-cream-deep: #e8f4f6;\r\n  --taffy-accent: var(--ds-taffy-lens);\r\n  --taffy-glow: rgba(145, 213, 232, 0.28);\r\n  --taffy-veil: #f6fbfc;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] {\r\n  --ds-taffy-cream: #211b32;\r\n  --ds-taffy-cream-deep: #181326;\r\n  --ds-taffy-text: #fff3e8;\r\n  --ds-taffy-text-on-dark: #fff3e8;\r\n  --taffy-text-halo:\r\n    0 0 0.8px rgba(255, 243, 232, 0.95),\r\n    0 0 7px rgba(231, 185, 87, 0.34),\r\n    0 0 14px rgba(242, 155, 194, 0.22);\r\n  --taffy-veil: #211b32;\r\n  --taffy-veil-strength: 0.14;\r\n  --taffy-veil-opacity: var(--taffy-veil-strength);\r\n  --taffy-panel-opacity: 82;\r\n  --taffy-glow: rgba(242, 165, 200, 0.22);\r\n  --taffy-plate-art: linear-gradient(\r\n    90deg,\r\n    rgba(220, 111, 158, 0.22),\r\n    rgba(39, 30, 55, 0.42) 50%,\r\n    rgba(185, 167, 232, 0.16)\r\n  );\r\n  --taffy-settings-frame-art: var(--taffy-plate-art);\r\n  --taffy-acrylic-bg: color-mix(in srgb, rgb(36, 29, 52) calc(var(--taffy-acrylic-percent) * 1%), transparent);\r\n  --taffy-acrylic-bg-strong: color-mix(in srgb, rgb(36, 29, 52) calc((var(--taffy-acrylic-percent) + 10) * 1%), transparent);\r\n  --taffy-acrylic-bg-soft: color-mix(in srgb, rgb(36, 29, 52) calc((var(--taffy-acrylic-percent) - 18) * 1%), transparent);\r\n  --taffy-acrylic-dark: color-mix(in srgb, rgb(36, 29, 52) calc(var(--taffy-panel-opacity) * 1%), transparent);\r\n  --taffy-acrylic-border: rgba(255, 244, 250, 0.14);\r\n  --taffy-acrylic-hairline: rgba(191, 174, 235, 0.22);\r\n  --taffy-acrylic-shadow: rgba(0, 0, 0, 0.3);\r\n  --taffy-acrylic-blur: 14px;\r\n  --taffy-acrylic-saturation: 1.05;\r\n  --taffy-muted: #a99db2;\r\n  background-color: transparent;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] :is(\r\n  [class*='sidebarCol'],\r\n  [class*='centerCol'],\r\n  [class*='detailsCol'],\r\n  [data-pane='conversation'],\r\n  [data-pane='sidebar']\r\n) {\r\n  --dsw-alias-bg-base: transparent;\r\n  --dsw-alias-bg-layer-1: color-mix(in srgb, var(--ds-taffy-cream) 22%, transparent);\r\n  --dsw-alias-bg-layer-2: color-mix(in srgb, #fffdfb 28%, transparent);\r\n  --dsw-alias-bg-layer-3: color-mix(in srgb, var(--ds-taffy-cream-deep) 36%, transparent);\r\n  --dsw-alias-bg-overlay: color-mix(in srgb, var(--ds-taffy-cream) 28%, transparent);\r\n  --dsw-alias-border-l1: rgba(73, 59, 80, 0.08);\r\n  --dsw-alias-border-l2: rgba(73, 59, 80, 0.14);\r\n  --dsw-alias-border-l2-darkmode-thin: rgba(73, 59, 80, 0.12);\r\n  --dsw-alias-border-l3: color-mix(in srgb, var(--ds-taffy-pink) 42%, transparent);\r\n  --dsw-alias-brand-primary: var(--ds-taffy-pink);\r\n  --dsw-alias-brand-text: var(--ds-taffy-text);\r\n  --dsw-alias-button-info-fill: var(--ds-taffy-pink);\r\n  --dsw-alias-button-info-hover: var(--ds-taffy-pink-soft);\r\n  --dsw-alias-label-caption: #6d5d74;\r\n  --dsw-alias-label-dimmed: #8a7a90;\r\n  --dsw-alias-label-primary-bluish: var(--ds-taffy-text);\r\n  --dsw-alias-label-primary-dimmed: #5c4c62;\r\n  --dsw-alias-label-primary-foreground: #fff7f1;\r\n  --dsw-alias-label-primary-inverted: #fff7f1;\r\n  --dsw-alias-label-primary: var(--ds-taffy-text);\r\n  --dsw-alias-label-secondary: #74697b;\r\n  --dsw-alias-label-tertiary: #948a99;\r\n  --dsw-alias-interactive-bg-hover: rgba(242, 155, 194, 0.12);\r\n  --dsw-alias-interactive-bg-active: rgba(185, 167, 232, 0.16);\r\n  --dsw-specific-bubble: #fff4ea;\r\n  --dsw-specific-bubble-highlight: #ffe4d2;\r\n  --dsw-specific-sidebar-fill: color-mix(in srgb, #ffd6e8 62%, transparent);\r\n  --dsw-specific-input-major: color-mix(in srgb, #fffdfb 90%, transparent);\r\n  color: var(--ds-taffy-text);\r\n  font-family: var(--taffy-font);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is(\r\n  [class*='sidebarCol'],\r\n  [class*='centerCol'],\r\n  [class*='detailsCol'],\r\n  [data-pane='conversation'],\r\n  [data-pane='sidebar']\r\n),\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] :is(\r\n  [class*='sidebarCol'],\r\n  [class*='centerCol'],\r\n  [class*='detailsCol'],\r\n  [data-pane='conversation'],\r\n  [data-pane='sidebar']\r\n) {\r\n  --dsw-alias-bg-layer-1: color-mix(in srgb, #2a2340 22%, transparent);\r\n  --dsw-alias-bg-layer-2: color-mix(in srgb, #2a2340 28%, transparent);\r\n  --dsw-alias-bg-layer-3: color-mix(in srgb, #181326 32%, transparent);\r\n  --dsw-alias-bg-overlay: color-mix(in srgb, #181326 28%, transparent);\r\n  --dsw-alias-border-l1: rgba(242, 165, 200, 0.12);\r\n  --dsw-alias-border-l2: rgba(185, 167, 232, 0.2);\r\n  --dsw-alias-border-l3: color-mix(in srgb, var(--ds-taffy-gold) 40%, transparent);\r\n  --dsw-alias-brand-primary: var(--ds-taffy-pink-soft);\r\n  --dsw-alias-brand-text: var(--ds-taffy-text);\r\n  --dsw-alias-label-caption: #e8dce8;\r\n  --dsw-alias-label-dimmed: #d4c8d8;\r\n  --dsw-alias-label-primary-bluish: var(--ds-taffy-text);\r\n  --dsw-alias-label-primary-dimmed: #f4eef4;\r\n  --dsw-alias-label-primary-foreground: #211b32;\r\n  --dsw-alias-label-primary-inverted: #211b32;\r\n  --dsw-alias-label-primary: var(--ds-taffy-text);\r\n  --dsw-alias-label-secondary: #d8cddf;\r\n  --dsw-alias-label-tertiary: #a99db2;\r\n  --dsw-specific-bubble: #2f2744;\r\n  --dsw-specific-bubble-highlight: #3a3250;\r\n  --dsw-specific-sidebar-fill: color-mix(in srgb, #271e37 64%, transparent);\r\n  --dsw-specific-input-major: color-mix(in srgb, #2a2340 88%, transparent);\r\n  color: var(--ds-taffy-text);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [class*='centerCol'] {\r\n  --dsw-alias-bg-base: transparent;\r\n  --dsw-alias-bg-layer-1: color-mix(in srgb, var(--ds-taffy-cream) 12%, transparent);\r\n  --dsw-alias-bg-layer-2: color-mix(in srgb, #fffdfb 14%, transparent);\r\n  --dsw-alias-bg-layer-3: color-mix(in srgb, var(--ds-taffy-cream-deep) 16%, transparent);\r\n  --dsw-alias-bg-overlay: color-mix(in srgb, var(--ds-taffy-cream) 18%, transparent);\r\n}\r\n\r\n/* AppFrame.frame paints --dsw-alias-bg-base. Keep that token transparent so\r\n   column translucency reveals the wallpaper instead of the host shell. */\r\nbody[data-dsh-taffy-theme] [id='root'] div:has(> [class*='sidebarCol']):has(> [class*='centerCol']) {\r\n  --dsw-alias-bg-base: transparent;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [class*='centerCol'],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [class*='centerCol'] {\r\n  --dsw-alias-bg-layer-1: color-mix(in srgb, #2a2340 12%, transparent);\r\n  --dsw-alias-bg-layer-2: color-mix(in srgb, #2a2340 14%, transparent);\r\n  --dsw-alias-bg-layer-3: color-mix(in srgb, #181326 16%, transparent);\r\n  --dsw-alias-bg-overlay: color-mix(in srgb, #181326 18%, transparent);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-state='idle'] {\r\n  --taffy-accent: var(--ds-agent-idle);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-state='thinking'] {\r\n  --taffy-accent: var(--ds-agent-thinking);\r\n  --taffy-glow: rgba(185, 167, 232, 0.3);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-state='tool-calling'] {\r\n  --taffy-accent: var(--ds-agent-tool);\r\n  --taffy-glow: rgba(145, 213, 232, 0.3);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-state='streaming'] {\r\n  --taffy-accent: var(--ds-agent-streaming);\r\n  --taffy-glow: rgba(242, 155, 194, 0.3);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-state='success'] {\r\n  --taffy-accent: var(--ds-agent-success);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-state='error'] {\r\n  --taffy-accent: var(--ds-agent-error);\r\n  --taffy-glow: rgba(196, 60, 60, 0.3);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-veil='thin'] {\r\n  --taffy-veil-strength: 0.08;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-veil='standard'] {\r\n  --taffy-veil-strength: 0.12;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-veil='thick'] {\r\n  --taffy-veil-strength: 0.18;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-frame-opacity='70'] {\r\n  --taffy-frame-opacity: 0.7;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-frame-opacity='85'] {\r\n  --taffy-frame-opacity: 0.85;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-frame-opacity='100'] {\r\n  --taffy-frame-opacity: 1;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-panel-opacity='55'] {\r\n  --taffy-panel-opacity: 55;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-panel-opacity='70'] {\r\n  --taffy-panel-opacity: 70;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-panel-opacity='85'] {\r\n  --taffy-panel-opacity: 85;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-panel-opacity='92'] {\r\n  --taffy-panel-opacity: 92;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-character-opacity='70'] {\r\n  --taffy-character-opacity: 0.7;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-character-opacity='85'] {\r\n  --taffy-character-opacity: 0.85;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-character-opacity='100'] {\r\n  --taffy-character-opacity: 1;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-acrylic-percent='50'] {\r\n  --taffy-acrylic-percent: 50;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-acrylic-percent='70'] {\r\n  --taffy-acrylic-percent: 70;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-acrylic-percent='85'] {\r\n  --taffy-acrylic-percent: 85;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-acrylic-percent='92'] {\r\n  --taffy-acrylic-percent: 92;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-intensity='low'] {\r\n  --taffy-motion-scale: 0.6;\r\n  --taffy-motion-duration: 1.4;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-intensity='high'] {\r\n  --taffy-motion-scale: 1.2;\r\n  --taffy-motion-duration: 0.8;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-motion='off'],\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-reduced-motion='true'] {\r\n  --taffy-motion-scale: 0;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-low-power] {\r\n  --taffy-acrylic-blur: 0px;\r\n  --taffy-motion-scale: 0;\r\n}\r\n";
		const surfacesCss = "/* Opt-in acrylic only. Never scan host overlays, details, or undeclared plugins. */\r\n\r\nbody[data-dsh-taffy-theme] :is(\r\n  [data-taffy-surface='acrylic'],\r\n  [data-plugin-root][data-taffy-acrylic='standard']\r\n) {\r\n  background: var(--taffy-acrylic-bg);\r\n  border-color: var(--taffy-acrylic-border);\r\n  box-shadow:\r\n    inset 0 1px var(--taffy-highlight),\r\n    0 16px 38px var(--taffy-acrylic-shadow);\r\n  backdrop-filter: blur(var(--taffy-acrylic-blur)) saturate(var(--taffy-acrylic-saturation));\r\n  -webkit-backdrop-filter: blur(var(--taffy-acrylic-blur)) saturate(var(--taffy-acrylic-saturation));\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-plugin-root][data-taffy-acrylic='soft'] {\r\n  background: var(--taffy-acrylic-bg-soft);\r\n  backdrop-filter: blur(12px) saturate(var(--taffy-acrylic-saturation));\r\n  -webkit-backdrop-filter: blur(12px) saturate(var(--taffy-acrylic-saturation));\r\n}\r\n\r\nbody[data-dsh-taffy-theme] :is(\r\n  [data-taffy-surface='solid'],\r\n  [data-plugin-root][data-taffy-acrylic='off']\r\n) {\r\n  background: var(--taffy-acrylic-bg-strong);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is(\r\n  [data-taffy-surface='acrylic'],\r\n  [data-plugin-root][data-taffy-acrylic='standard']\r\n),\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] :is(\r\n  [data-taffy-surface='acrylic'],\r\n  [data-plugin-root][data-taffy-acrylic='standard']\r\n) {\r\n  background: var(--taffy-acrylic-bg);\r\n}\r\n\r\n@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {\r\n  body[data-dsh-taffy-theme] :is(\r\n    [data-taffy-surface='acrylic'],\r\n    [data-plugin-root][data-taffy-acrylic='standard'],\r\n    [data-plugin-root][data-taffy-acrylic='soft']\r\n  ) {\r\n    background: var(--taffy-acrylic-bg-strong);\r\n  }\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-low-power] :is(\r\n  [data-taffy-surface='acrylic'],\r\n  [data-plugin-root][data-taffy-acrylic='standard'],\r\n  [data-plugin-root][data-taffy-acrylic='soft']\r\n) {\r\n  backdrop-filter: none;\r\n  -webkit-backdrop-filter: none;\r\n  background: var(--taffy-acrylic-bg-strong);\r\n}\r\n";
		const badgesCss = "/* Taffy conversation stage: pink outer, gold inner, curtains, candy corners. */\r\n\r\nbody[data-dsh-taffy-theme] [data-skin-chrome='atelier-frame'] {\r\n  position: fixed;\r\n  z-index: 0;\r\n  box-sizing: border-box;\r\n  overflow: visible;\r\n  pointer-events: none;\r\n  left: var(--taffy-frame-left, calc(var(--taffy-viewport-left, var(--taffy-content-left, var(--taffy-conversation-content-left))) - 10px));\r\n  top: var(--taffy-frame-top, calc(var(--taffy-viewport-top, var(--taffy-conversation-viewport-top)) - 10px));\r\n  width: var(--taffy-frame-width, calc(var(--taffy-viewport-width, var(--taffy-content-width, var(--taffy-conversation-content-width))) + 20px));\r\n  height: var(--taffy-frame-height, calc(var(--taffy-viewport-height, var(--taffy-conversation-viewport-height)) + 20px));\r\n  right: auto;\r\n  bottom: auto;\r\n  border: 2.5px solid rgba(242, 155, 194, var(--taffy-frame-opacity, 1));\r\n  border-radius: 26px;\r\n  background: var(--taffy-acrylic-light);\r\n  opacity: 1;\r\n  transition: none;\r\n  box-shadow:\r\n    inset 0 0 0 1.5px rgba(231, 185, 87, 0.78),\r\n    0 0 0 1px rgba(185, 167, 232, 0.38),\r\n    0 10px 24px rgba(242, 155, 194, 0.14);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-skin-chrome='atelier-frame'],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-skin-chrome='atelier-frame'] {\r\n  border-color: rgba(242, 165, 200, var(--taffy-frame-opacity, 1));\r\n  background: var(--taffy-acrylic-dark);\r\n  box-shadow:\r\n    inset 0 0 0 1.5px rgba(231, 185, 87, 0.62),\r\n    0 0 0 1px rgba(185, 167, 232, 0.32),\r\n    0 10px 24px rgba(33, 27, 50, 0.22);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-frame-hidden] [data-skin-chrome='atelier-frame'],\r\nbody[data-dsh-taffy-theme][data-taffy-frame-hidden] [data-skin-chrome='taffy-top-curtain'],\r\nbody[data-dsh-taffy-theme][data-taffy-frame-hidden] [data-skin-chrome='taffy-bottom-curtain'] {\r\n  opacity: 0;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-skin-chrome='taffy-top-curtain'],\r\nbody[data-dsh-taffy-theme] [data-skin-chrome='taffy-bottom-curtain'] {\r\n  position: fixed;\r\n  z-index: 0;\r\n  pointer-events: none;\r\n  left: var(--taffy-frame-left, var(--taffy-content-left, var(--taffy-conversation-left)));\r\n  width: var(--taffy-frame-width, var(--taffy-content-width, var(--taffy-conversation-width)));\r\n  right: auto;\r\n  opacity: 1;\r\n  transition: none;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-skin-chrome='taffy-top-curtain'] {\r\n  top: var(--taffy-frame-top, var(--taffy-viewport-top));\r\n  height: 28px;\r\n  border-radius: 26px 26px 0 0;\r\n  background:\r\n    linear-gradient(180deg, rgba(242, 155, 194, 0.28), rgba(231, 185, 87, 0.12) 55%, transparent 100%);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-skin-chrome='taffy-bottom-curtain'] {\r\n  top: calc(var(--taffy-composer-top, calc(var(--taffy-frame-top, var(--taffy-viewport-top)) + var(--taffy-frame-height, var(--taffy-viewport-height)))) - 22px);\r\n  height: 22px;\r\n  border-radius: 0;\r\n  background:\r\n    radial-gradient(ellipse 88% 140% at 50% 120%, rgba(145, 213, 232, 0.22), transparent 68%),\r\n    radial-gradient(ellipse 72% 120% at 50% 100%, rgba(185, 167, 232, 0.16), transparent 74%),\r\n    linear-gradient(0deg, rgba(242, 155, 194, 0.12), transparent 100%);\r\n}\r\n\r\nbody[data-dsh-taffy-theme]:not([data-taffy-chat-active]) [data-skin-chrome='taffy-top-curtain'] {\r\n  height: 22px;\r\n}\r\n\r\nbody[data-dsh-taffy-theme]:not([data-taffy-chat-active]) [data-skin-chrome='taffy-bottom-curtain'] {\r\n  height: 22px;\r\n  top: calc(var(--taffy-frame-top, var(--taffy-viewport-top)) + var(--taffy-frame-height, var(--taffy-viewport-height)) - 22px);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-frame-badge] {\r\n  position: absolute;\r\n  top: -16px;\r\n  left: 50%;\r\n  width: 88px;\r\n  height: 32px;\r\n  translate: -50% 0;\r\n  pointer-events: none;\r\n  opacity: 0;\r\n  border-radius: 999px;\r\n  background:\r\n    radial-gradient(circle at 22% 54%, #ffd8e7 0 8px, transparent 9px),\r\n    radial-gradient(circle at 78% 54%, #ffd8e7 0 8px, transparent 9px),\r\n    linear-gradient(180deg, rgba(242, 155, 194, 0.95), rgba(231, 185, 87, 0.88));\r\n  box-shadow: 0 0 0 1.5px rgba(231, 185, 87, 0.72);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-frame-corners] {\r\n  position: absolute;\r\n  inset: 0;\r\n  pointer-events: none;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-frame-corner] {\r\n  position: absolute;\r\n  pointer-events: none;\r\n  width: 30px;\r\n  height: 30px;\r\n  border: 2px solid rgba(242, 155, 194, 0.92);\r\n  box-shadow: inset 0 0 0 1px rgba(231, 185, 87, 0.7);\r\n  background: transparent;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-frame-corner]::after {\r\n  content: '';\r\n  position: absolute;\r\n  width: 8px;\r\n  height: 8px;\r\n  border-radius: 50%;\r\n  background: radial-gradient(circle at 35% 30%, #fff7f1, #f29bc2 55%, #e7b957);\r\n  pointer-events: none;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-frame-corner='top-left'] {\r\n  top: 10px;\r\n  left: 10px;\r\n  border-right: 0;\r\n  border-bottom: 0;\r\n  border-radius: 12px 0 0 0;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-frame-corner='top-left']::after {\r\n  top: -3px;\r\n  left: -3px;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-frame-corner='top-right'] {\r\n  top: 10px;\r\n  right: 10px;\r\n  border-left: 0;\r\n  border-bottom: 0;\r\n  border-radius: 0 12px 0 0;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-frame-corner='top-right']::after {\r\n  top: -3px;\r\n  right: -3px;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-frame-corner='bottom-left'] {\r\n  bottom: 10px;\r\n  left: 10px;\r\n  border-right: 0;\r\n  border-top: 0;\r\n  border-radius: 0 0 0 12px;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-frame-corner='bottom-left']::after {\r\n  bottom: -3px;\r\n  left: -3px;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-frame-corner='bottom-right'] {\r\n  bottom: 10px;\r\n  right: 10px;\r\n  border-left: 0;\r\n  border-top: 0;\r\n  border-radius: 0 0 12px 0;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-frame-corner='bottom-right']::after {\r\n  bottom: -3px;\r\n  right: -3px;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-frame-compact] [data-taffy-frame-corner],\r\nbody[data-dsh-taffy-theme][data-taffy-frame-compact] [data-taffy-frame-badge] {\r\n  opacity: 0;\r\n}\r\n\r\n@media (max-width: 700px) {\r\n  body[data-dsh-taffy-theme] [data-skin-chrome='taffy-top-curtain'],\r\n  body[data-dsh-taffy-theme] [data-skin-chrome='taffy-bottom-curtain'],\r\n  body[data-dsh-taffy-theme] [data-taffy-frame-badge] {\r\n    opacity: 0;\r\n  }\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-skin-chrome='sidebar-trim'] {\r\n  position: fixed;\r\n  z-index: 0;\r\n  pointer-events: none;\r\n  left: 0;\r\n  top: 0;\r\n  bottom: 0;\r\n  width: var(--taffy-sidebar-width, 280px);\r\n  overflow: visible;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-sidebar-size='rail'] [data-skin-chrome='sidebar-trim'] {\r\n  display: none;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-sidebar-corner],\r\nbody[data-dsh-taffy-theme] [data-taffy-sidebar-ornament] {\r\n  position: absolute;\r\n  pointer-events: none;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-sidebar-corner] {\r\n  width: 28px;\r\n  height: 28px;\r\n  border: 1.5px solid rgba(231, 185, 87, 0.58);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-sidebar-corner='top-left'],\r\nbody[data-dsh-taffy-theme] [data-taffy-sidebar-corner='top-right'] {\r\n  display: none;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-sidebar-corner='bottom-left'] {\r\n  bottom: 10px;\r\n  left: 10px;\r\n  border-right: 0;\r\n  border-top: 0;\r\n  border-radius: 0 0 0 10px;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-sidebar-corner='bottom-right'] {\r\n  bottom: 10px;\r\n  right: 10px;\r\n  border-left: 0;\r\n  border-top: 0;\r\n  border-radius: 0 0 10px 0;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-sidebar-ornament='ribbon'] {\r\n  display: none;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-sidebar-ornament='swag'] {\r\n  left: 18px;\r\n  right: 18px;\r\n  bottom: 58px;\r\n  height: 28px;\r\n  background:\r\n    linear-gradient(90deg, transparent, rgba(231, 185, 87, 0.55) 12% 88%, transparent) center 10px / 100% 1px no-repeat,\r\n    linear-gradient(90deg, transparent, rgba(242, 155, 194, 0.4) 18% 82%, transparent) center 13px / 100% 1px no-repeat;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-taffy-sidebar-ornament='ribbon'],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-taffy-sidebar-ornament='ribbon'] {\r\n  display: none;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-phase='hero'] [class*='headline']:has(> [class*='fish']) > [class*='fish'] {\r\n  border: 1px solid rgba(231, 185, 87, 0.78);\r\n  border-radius: 50%;\r\n  outline: 1px solid rgba(242, 155, 194, 0.42);\r\n  outline-offset: 4px;\r\n  background: color-mix(in srgb, var(--ds-taffy-cream) 62%, transparent);\r\n  box-shadow:\r\n    0 0 0 8px rgba(242, 155, 194, 0.12),\r\n    0 6px 16px rgba(73, 59, 80, 0.16);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) [aria-current='page'] {\r\n  background: rgba(242, 155, 194, 0.18);\r\n  box-shadow: inset 3px 0 0 var(--ds-taffy-pink);\r\n  border-color: rgba(242, 155, 194, 0.32);\r\n}\r\n";
		const componentsCss = "/* Decorative layers + native DSH chrome. Do not restyle third-party plugin roots. */\r\n\r\nbody[data-dsh-taffy-theme] [id='root'] {\r\n  background: transparent;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [id='root'] div:has(> [class*='sidebarCol']):has(> [class*='centerCol']) {\r\n  background: transparent;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-skin-chrome='character-stage'] {\r\n  position: fixed;\r\n  inset: 0;\r\n  z-index: 0;\r\n  overflow: hidden;\r\n  pointer-events: none;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-wallpaper] {\r\n  position: fixed;\r\n  inset: 0;\r\n  z-index: 0;\r\n  width: 100%;\r\n  height: 100%;\r\n  object-fit: cover;\r\n  object-position: center 76%;\r\n  pointer-events: none;\r\n  opacity: 1;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-taffy-wallpaper],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-taffy-wallpaper] {\r\n  object-position: center 62%;\r\n  filter: saturate(1.08) contrast(1.04);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-wallpaper][data-taffy-asset-error] {\r\n  opacity: 0;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-veil='curtain'] {\r\n  position: absolute;\r\n  inset: 0;\r\n  z-index: 1;\r\n  pointer-events: none;\r\n  opacity: 1;\r\n  background:\r\n    radial-gradient(\r\n      ellipse 48% 62% at 52% 42%,\r\n      color-mix(\r\n        in srgb,\r\n        var(--taffy-veil, var(--ds-taffy-cream)) calc(var(--taffy-veil-opacity, 0.12) * 130%),\r\n        transparent\r\n      ),\r\n      color-mix(\r\n        in srgb,\r\n        var(--taffy-veil, var(--ds-taffy-cream)) calc(var(--taffy-veil-opacity, 0.12) * 35%),\r\n        transparent\r\n      ) 68%,\r\n      transparent 100%\r\n    );\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-atmosphere] {\r\n  position: absolute;\r\n  inset: 0;\r\n  z-index: 3;\r\n  pointer-events: none;\r\n  background:\r\n    linear-gradient(\r\n      180deg,\r\n      transparent 48%,\r\n      color-mix(in srgb, var(--taffy-veil, var(--ds-taffy-cream)) 16%, transparent) 100%\r\n    ),\r\n    radial-gradient(\r\n      ellipse 90% 40% at 50% 100%,\r\n      color-mix(in srgb, var(--taffy-veil, var(--ds-taffy-cream)) 22%, transparent),\r\n      transparent 70%\r\n    );\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-taffy-atmosphere],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-taffy-atmosphere] {\r\n  background:\r\n    radial-gradient(ellipse 36% 48% at 18% 62%, rgba(242, 155, 194, 0.16), transparent 72%),\r\n    radial-gradient(ellipse 28% 36% at 84% 70%, rgba(231, 185, 87, 0.1), transparent 70%),\r\n    linear-gradient(180deg, transparent 42%, rgba(18, 10, 28, 0.28) 100%);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-ground] {\r\n  position: absolute;\r\n  z-index: 2;\r\n  pointer-events: none;\r\n  height: 54px;\r\n  border-radius: 50%;\r\n  filter: blur(12px);\r\n  background: radial-gradient(ellipse, rgba(73, 59, 80, 0.28), transparent 72%);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-ground='left'] {\r\n  left: 0;\r\n  bottom: 10px;\r\n  width: min(30vw, 380px);\r\n  translate: calc(var(--taffy-conversation-left, var(--taffy-sidebar-width)) + clamp(16px, 2vw, 36px)) 0;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-ground='right'] {\r\n  right: calc(var(--taffy-right-panel-width, var(--taffy-frame-right-inset, 0px)) + 12px);\r\n  bottom: 12px;\r\n  width: min(22vw, 280px);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-taffy-ground],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-taffy-ground] {\r\n  background: radial-gradient(ellipse, rgba(242, 155, 194, 0.22), rgba(8, 4, 16, 0.42) 42%, transparent 74%);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-hide-left] [data-taffy-ground='left'],\r\nbody[data-dsh-taffy-theme][data-taffy-hide-right] [data-taffy-ground='right'],\r\nbody[data-dsh-taffy-theme][data-taffy-right-crowded] [data-taffy-ground='right'] {\r\n  opacity: 0;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-sparkles] {\r\n  position: absolute;\r\n  inset: 0;\r\n  z-index: 4;\r\n  pointer-events: none;\r\n  opacity: 0.55;\r\n  background-image:\r\n    radial-gradient(circle, rgba(255, 216, 231, 0.95) 0 1.5px, transparent 2.4px),\r\n    radial-gradient(circle, rgba(231, 185, 87, 0.78) 0 1.2px, transparent 2px),\r\n    radial-gradient(circle, rgba(242, 155, 194, 0.7) 0 1px, transparent 1.8px);\r\n  background-size: 220px 180px, 280px 240px, 160px 200px;\r\n  background-position: 12% 18%, 78% 32%, 42% 72%;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-low-power] [data-taffy-sparkles],\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-motion='off'] [data-taffy-sparkles],\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-reduced-motion='true'] [data-taffy-sparkles] {\r\n  display: none;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-taffy-sparkles],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-taffy-sparkles] {\r\n  opacity: 0.42;\r\n  background-image:\r\n    radial-gradient(circle, rgba(255, 236, 180, 0.95) 0 1.6px, transparent 2.6px),\r\n    radial-gradient(circle, rgba(242, 165, 200, 0.7) 0 1.2px, transparent 2.1px),\r\n    radial-gradient(circle, rgba(185, 167, 232, 0.65) 0 1px, transparent 1.8px);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-character] {\r\n  position: absolute;\r\n  display: block;\r\n  z-index: 2;\r\n  width: auto;\r\n  max-width: none;\r\n  object-fit: contain;\r\n  object-position: center bottom;\r\n  pointer-events: none;\r\n  opacity: var(--taffy-character-opacity, 1);\r\n  filter:\r\n    saturate(1.02)\r\n    contrast(0.98)\r\n    drop-shadow(0 0 14px rgba(255, 216, 180, 0.22))\r\n    drop-shadow(0 18px 16px rgba(73, 59, 80, 0.28));\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-character][data-taffy-asset-error] {\r\n  opacity: 0;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-taffy-character],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-taffy-character] {\r\n  filter:\r\n    brightness(1.04)\r\n    saturate(0.98)\r\n    contrast(1.04)\r\n    drop-shadow(0 0 22px rgba(242, 155, 194, 0.38))\r\n    drop-shadow(0 0 36px rgba(231, 185, 87, 0.16))\r\n    drop-shadow(0 20px 18px rgba(8, 4, 16, 0.5));\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-character='left'] {\r\n  left: 0;\r\n  bottom: clamp(-18px, -1.2vh, -4px);\r\n  translate: calc(var(--taffy-conversation-left, var(--taffy-sidebar-width)) + clamp(10px, 1.6vw, 28px)) 0;\r\n  height: clamp(520px, 88vh, 1080px);\r\n  max-width: min(32vw, 460px);\r\n  transform-origin: center bottom;\r\n  transition: none;\r\n}\r\n\r\nbody[data-dsh-taffy-theme]:not([data-ds-dark-theme]):not([data-taffy-preset='taffy-night']) [data-taffy-character='left'] {\r\n  filter:\r\n    saturate(1.02)\r\n    sepia(0.1)\r\n    drop-shadow(-14px 0 18px rgba(255, 214, 150, 0.42))\r\n    drop-shadow(0 0 0.45px #fff4ea)\r\n    drop-shadow(0 0 16px rgba(255, 216, 180, 0.28))\r\n    drop-shadow(0 16px 14px rgba(120, 70, 50, 0.22));\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-character='right'] {\r\n  right: calc(var(--taffy-right-panel-width, var(--taffy-frame-right-inset, 0px)) - 8px);\r\n  bottom: clamp(-16px, -1vh, -4px);\r\n  height: clamp(500px, 84vh, 1020px);\r\n  max-width: min(24vw, 340px);\r\n  object-position: right bottom;\r\n  transform-origin: center bottom;\r\n  transition:\r\n    right 420ms cubic-bezier(0.22, 0.78, 0.2, 1),\r\n    height 420ms cubic-bezier(0.22, 0.78, 0.2, 1),\r\n    opacity 220ms ease;\r\n}\r\n\r\n/* Conservatory: left figure sits on the greenhouse floor. */\r\nbody[data-dsh-taffy-theme]:not([data-ds-dark-theme]):not([data-taffy-preset='taffy-night']) [data-taffy-character='left'][data-taffy-pose='sit'] {\r\n  height: clamp(280px, 52vh, 620px);\r\n  max-width: min(36vw, 520px);\r\n  bottom: clamp(4px, 1.4vh, 18px);\r\n}\r\n\r\n/* Conservatory: right figure is a standing salute, keep her taller. */\r\nbody[data-dsh-taffy-theme]:not([data-ds-dark-theme]):not([data-taffy-preset='taffy-night']) [data-taffy-character='right'][data-taffy-pose='stand'] {\r\n  height: clamp(420px, 72vh, 880px);\r\n  bottom: clamp(-8px, -0.4vh, 0px);\r\n}\r\n\r\n/* Concert: left wink is a bust, plant her in the spotlight. */\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-taffy-character='left'][data-taffy-pose='bust'],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-taffy-character='left'][data-taffy-pose='bust'] {\r\n  height: clamp(340px, 58vh, 720px);\r\n  max-width: min(30vw, 420px);\r\n  bottom: clamp(8px, 2vh, 28px);\r\n}\r\n\r\n/* Concert: right figure sits at the piano on stage. */\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-taffy-character='right'][data-taffy-pose='sit'],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-taffy-character='right'][data-taffy-pose='sit'] {\r\n  height: clamp(250px, 46vh, 540px);\r\n  max-width: min(28vw, 380px);\r\n  bottom: clamp(6px, 1.8vh, 22px);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-better-sidebar-open] [data-taffy-character='right'],\r\nbody[data-dsh-taffy-theme][data-taffy-details-open] [data-taffy-character='right'],\r\nbody[data-dsh-taffy-theme][data-dsh-floating-panel-open] [data-taffy-character='right'] {\r\n  right: calc(var(--taffy-right-panel-width, var(--taffy-frame-right-inset, 0px)) - 6px);\r\n  height: clamp(360px, 62vh, 780px);\r\n  opacity: 0.92;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-better-sidebar-open] [data-taffy-character='right'][data-taffy-pose='sit'],\r\nbody[data-dsh-taffy-theme][data-taffy-details-open] [data-taffy-character='right'][data-taffy-pose='sit'],\r\nbody[data-dsh-taffy-theme][data-dsh-floating-panel-open] [data-taffy-character='right'][data-taffy-pose='sit'] {\r\n  height: clamp(220px, 38vh, 420px);\r\n  opacity: 0.94;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-scene='fused'] [data-taffy-character],\r\nbody[data-dsh-taffy-theme][data-taffy-scene='fused'] [data-taffy-ground] {\r\n  display: none;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-hide-right] [data-taffy-character='right'],\r\nbody[data-dsh-taffy-theme][data-taffy-right-crowded] [data-taffy-character='right'] {\r\n  opacity: 0;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) {\r\n  position: relative;\r\n  background: var(--dsw-specific-sidebar-fill);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) [data-taffy-mascot='sidebar'] {\r\n  position: absolute;\r\n  left: 50%;\r\n  top: auto;\r\n  bottom: calc(var(--taffy-sidebar-footer-height, 56px) + 6px);\r\n  z-index: 0;\r\n  width: min(118px, calc(100% - 48px));\r\n  height: auto;\r\n  max-height: 15vh;\r\n  object-fit: contain;\r\n  object-position: center bottom;\r\n  border-radius: 0;\r\n  pointer-events: none;\r\n  opacity: var(--taffy-character-opacity, 1);\r\n  translate: -50% 0;\r\n  filter: drop-shadow(0 6px 12px rgba(73, 59, 80, 0.16));\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-hide-mascot] [data-taffy-mascot='sidebar'],\r\nbody[data-dsh-taffy-theme][data-taffy-sidebar-size='rail'] [data-taffy-mascot='sidebar'] {\r\n  display: none;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-taffy-mascot='sidebar'][data-taffy-asset-error] {\r\n  opacity: 0;\r\n}\r\n\r\n@media (max-width: 1080px) {\r\n  body[data-dsh-taffy-theme] [data-taffy-character='left'] {\r\n    height: clamp(380px, 70vh, 720px);\r\n  }\r\n\r\n  body[data-dsh-taffy-theme] [data-taffy-character='right'] {\r\n    height: clamp(360px, 66vh, 680px);\r\n  }\r\n}\r\n\r\n@media (max-width: 700px) {\r\n  body[data-dsh-taffy-theme] [data-taffy-character] {\r\n    height: clamp(240px, 46vh, 420px);\r\n    opacity: 0.88;\r\n  }\r\n\r\n  body[data-dsh-taffy-theme] [data-taffy-mascot='sidebar'] {\r\n    opacity: 0.72;\r\n    width: 96px;\r\n  }\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [class*='centerCol'] {\r\n  background: rgba(255, 247, 241, 0.16);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [class*='centerCol'],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [class*='centerCol'] {\r\n  background: rgba(33, 27, 50, 0.22);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [class*='centerCol'] [data-phase] {\r\n  background-color: transparent;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [class*='centerCol'] [data-conversation-scroll] {\r\n  background-color: transparent;\r\n  border-radius: 22px;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [class*='centerCol'] [data-conversation-scroll],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [class*='centerCol'] [data-conversation-scroll] {\r\n  background-color: transparent;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] :is(\r\n  [data-pane='conversation'],\r\n  [class*='centerCol']\r\n) :is([data-conversation-scroll], [data-chat-flow], [data-composer-card], [data-input-mirror], textarea) {\r\n  --dsw-alias-label-primary: var(--ds-taffy-text);\r\n  --dsw-alias-label-primary-bluish: var(--ds-taffy-text);\r\n  --dsw-alias-brand-text: var(--ds-taffy-text);\r\n  color: var(--ds-taffy-text);\r\n  caret-color: var(--ds-taffy-pink);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-chat-flow] :is(\r\n  [class*='markdown'],\r\n  [class*='Markdown'],\r\n  [data-slot='conversation.chat.node']\r\n) {\r\n  --dsw-alias-label-primary: var(--ds-taffy-text);\r\n  color: var(--ds-taffy-text);\r\n  font-weight: 500;\r\n  text-shadow: var(--taffy-text-halo);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-chat-flow] :is(pre, code, kbd, samp) {\r\n  text-shadow: none;\r\n  font-weight: inherit;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-composer-card] {\r\n  position: relative;\r\n  overflow: visible;\r\n  background: color-mix(in srgb, var(--taffy-acrylic-light) 88%, transparent);\r\n  border: 1px solid rgba(242, 155, 194, 0.42);\r\n  border-radius: 16px;\r\n  box-shadow:\r\n    inset 0 0 0 1px rgba(231, 185, 87, 0.35),\r\n    inset 0 1px var(--taffy-highlight);\r\n  backdrop-filter: blur(12px) saturate(1.06);\r\n  -webkit-backdrop-filter: blur(12px) saturate(1.06);\r\n  color: var(--ds-taffy-text);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-low-power] [data-composer-card] {\r\n  backdrop-filter: none;\r\n  -webkit-backdrop-filter: none;\r\n  background: var(--taffy-acrylic-bg-strong);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-composer-card]::before {\r\n  content: '';\r\n  position: absolute;\r\n  left: 8%;\r\n  right: 8%;\r\n  top: -2px;\r\n  height: 2px;\r\n  pointer-events: none;\r\n  background: linear-gradient(90deg, transparent, rgba(242, 155, 194, 0.95), rgba(231, 185, 87, 0.95), rgba(242, 155, 194, 0.95), transparent);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-composer-card]::after {\r\n  content: none;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-composer-card] {\r\n  background: var(--taffy-acrylic-dark);\r\n  border-color: var(--taffy-border-dark);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-slot='sidebar.settings'] [role='dialog'][aria-modal='true'] {\r\n  background: var(--ds-taffy-cream);\r\n  color: var(--ds-taffy-text);\r\n  --dsw-alias-bg-base: var(--ds-taffy-cream);\r\n  --dsw-alias-bg-layer-1: var(--ds-taffy-cream);\r\n  --dsw-alias-bg-layer-2: var(--ds-taffy-cream);\r\n  --dsw-alias-bg-layer-3: var(--ds-taffy-cream-deep);\r\n}\r\n\r\n[data-dsh-taffy-settings] {\r\n  --ds-taffy-pink: #f29bc2;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] .dsh-taffy-general-row,\r\n[data-dsh-taffy-settings].dsh-taffy-general-row {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 8px;\r\n  padding: 16px 0;\r\n  border-bottom: 1px solid var(--dsw-alias-border-l2, rgba(73, 59, 80, 0.14));\r\n}\r\n\r\n:is(body[data-dsh-taffy-theme], [data-dsh-taffy-settings]) .dsh-taffy-general-title {\r\n  font-size: 14px;\r\n  font-weight: 400;\r\n  line-height: 22px;\r\n  color: var(--dsw-alias-label-primary);\r\n}\r\n\r\n:is(body[data-dsh-taffy-theme], [data-dsh-taffy-settings]) .dsh-taffy-general-note {\r\n  font-size: 12px;\r\n  line-height: 18px;\r\n  color: var(--dsw-alias-label-secondary);\r\n}\r\n\r\n:is(body[data-dsh-taffy-theme], [data-dsh-taffy-settings]) .dsh-taffy-slider-row {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 6px;\r\n}\r\n\r\n:is(body[data-dsh-taffy-theme], [data-dsh-taffy-settings]) .dsh-taffy-slider-head {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  gap: 12px;\r\n  font-size: 14px;\r\n  line-height: 22px;\r\n  color: var(--dsw-alias-label-primary);\r\n}\r\n\r\n:is(body[data-dsh-taffy-theme], [data-dsh-taffy-settings]) .dsh-taffy-slider-row input[type='range'] {\r\n  width: 100%;\r\n  accent-color: var(--ds-taffy-pink, #f29bc2);\r\n}\r\n\r\n:is(body[data-dsh-taffy-theme], [data-dsh-taffy-settings]) .dsh-taffy-general-cubes {\r\n  display: flex;\r\n  align-items: stretch;\r\n  flex-wrap: wrap;\r\n  gap: 8px;\r\n}\r\n\r\n:is(body[data-dsh-taffy-theme], [data-dsh-taffy-settings]) .dsh-taffy-general-cube {\r\n  box-sizing: border-box;\r\n  flex: 1 1 180px;\r\n  min-height: 82px;\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  justify-content: center;\r\n  gap: 4px;\r\n  padding: 20px 32px;\r\n  border: 1px solid var(--dsw-alias-border-l2, rgba(73, 59, 80, 0.14));\r\n  border-radius: 16px;\r\n  background: transparent;\r\n  font: inherit;\r\n  font-size: 14px;\r\n  line-height: 22px;\r\n  color: var(--dsw-alias-label-primary);\r\n  cursor: pointer;\r\n}\r\n\r\n:is(body[data-dsh-taffy-theme], [data-dsh-taffy-settings]) .dsh-taffy-general-cube:hover:not(.is-selected) {\r\n  background: var(--dsw-alias-interactive-bg-hover, rgba(242, 155, 194, 0.12));\r\n}\r\n\r\n:is(body[data-dsh-taffy-theme], [data-dsh-taffy-settings]) .dsh-taffy-general-cube.is-selected {\r\n  background: var(--dsw-alias-bg-layer-2, rgba(255, 216, 231, 0.35));\r\n  border-color: var(--dsw-alias-border-l3, rgba(242, 155, 194, 0.42));\r\n}\r\n\r\n:is(body[data-dsh-taffy-theme], [data-dsh-taffy-settings]) .dsh-taffy-general-cube:disabled {\r\n  opacity: 0.45;\r\n  cursor: default;\r\n}\r\n\r\n:is(body[data-dsh-taffy-theme], [data-dsh-taffy-settings]) .dsh-taffy-clover {\r\n  width: 16px;\r\n  height: 16px;\r\n  color: var(--ds-taffy-pink, #f29bc2);\r\n}\r\n\r\n/* Circular chips: new-session stays 36px; brand (collapse) is larger. */\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-sidebar-size='rail'] [data-slot='sidebar.settings'] > :is(button, [role='button']),\r\nbody[data-dsh-taffy-theme][data-taffy-sidebar-size='rail'] [data-slot='sidebar.settings'] button[aria-haspopup='dialog'],\r\nbody[data-dsh-taffy-theme][data-taffy-sidebar-size='rail'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']),\r\nbody[data-dsh-taffy-theme][data-taffy-sidebar-size='rail'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand']) {\r\n  position: relative;\r\n  box-sizing: border-box;\r\n  width: 36px;\r\n  height: 36px;\r\n  min-width: 36px;\r\n  min-height: 36px;\r\n  max-width: 36px;\r\n  padding: 0;\r\n  aspect-ratio: 1;\r\n  border-radius: 50%;\r\n  overflow: visible;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='打开侧边栏'],\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Open sidebar'],\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='收起侧边栏'],\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Collapse sidebar'] {\r\n  position: relative;\r\n  box-sizing: border-box;\r\n  width: 48px;\r\n  height: 48px;\r\n  min-width: 48px;\r\n  min-height: 48px;\r\n  max-width: 48px;\r\n  padding: 0;\r\n  aspect-ratio: 1;\r\n  border-radius: 50%;\r\n  overflow: visible;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='发送消息'],\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='Send message'],\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='停止生成'],\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='Stop generating'],\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='命令'],\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='Commands'] {\r\n  position: relative;\r\n  box-sizing: border-box;\r\n  width: 42px;\r\n  height: 42px;\r\n  min-width: 42px;\r\n  min-height: 42px;\r\n  padding: 0;\r\n  aspect-ratio: 1;\r\n  border-radius: 50%;\r\n  overflow: visible;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='命令'],\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='Commands'] {\r\n  overflow: visible;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-sidebar-size='rail'] [data-slot='sidebar.settings'] > :is(button, [role='button']),\r\nbody[data-dsh-taffy-theme][data-taffy-sidebar-size='rail'] [data-slot='sidebar.settings'] button[aria-haspopup='dialog'] {\r\n  width: 42px;\r\n  height: 42px;\r\n  min-width: 42px;\r\n  min-height: 42px;\r\n  overflow: visible;\r\n  border-image: none;\r\n  border-radius: 50%;\r\n  font-size: 0;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] [data-composer-card] button[aria-label='发送消息'] > svg,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] [data-composer-card] button[aria-label='Send message'] > svg,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] [data-composer-card] button[aria-label='停止生成'] > svg,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] [data-composer-card] button[aria-label='Stop generating'] > svg,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] [data-composer-card] button[aria-label='命令'] > svg,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] [data-composer-card] button[aria-label='Commands'] > svg,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready][data-taffy-sidebar-size='rail'] [data-slot='sidebar.settings'] button[aria-haspopup='dialog'] svg,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready][data-taffy-sidebar-size='rail'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']) > svg,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready][data-taffy-sidebar-size='rail'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand']) > svg,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='打开侧边栏'] > svg,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Open sidebar'] > svg,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='收起侧边栏'] > svg,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Collapse sidebar'] > svg {\r\n  opacity: 0;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] [data-composer-card] button[aria-label='发送消息']::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] [data-composer-card] button[aria-label='Send message']::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] [data-composer-card] button[aria-label='停止生成']::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] [data-composer-card] button[aria-label='Stop generating']::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] [data-composer-card] button[aria-label='命令']::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] [data-composer-card] button[aria-label='Commands']::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready][data-taffy-sidebar-size='rail'] [data-slot='sidebar.settings'] button[aria-haspopup='dialog']::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready][data-taffy-sidebar-size='rail'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand'])::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready][data-taffy-sidebar-size='rail'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand'])::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='打开侧边栏']::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Open sidebar']::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='收起侧边栏']::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Collapse sidebar']::after {\r\n  content: '';\r\n  position: absolute;\r\n  inset: 0;\r\n  pointer-events: none;\r\n  border-radius: 50%;\r\n  background-repeat: no-repeat;\r\n  background-position: center;\r\n  background-size: 118% 118%;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] [data-composer-card] button[aria-label='发送消息']::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] [data-composer-card] button[aria-label='Send message']::after {\r\n  background-image: var(--taffy-q-send);\r\n  background-position: center;\r\n  background-size: 122% 122%;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] [data-composer-card] button[aria-label='停止生成']::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] [data-composer-card] button[aria-label='Stop generating']::after {\r\n  background-image: var(--taffy-q-stop);\r\n  background-position: center;\r\n  background-size: 122% 122%;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] [data-composer-card] button[aria-label='命令']::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] [data-composer-card] button[aria-label='Commands']::after {\r\n  background-image: var(--taffy-q-command);\r\n  background-position: center;\r\n  background-size: 122% 122%;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready][data-taffy-sidebar-size='rail'] [data-slot='sidebar.settings'] button[aria-haspopup='dialog']::after {\r\n  background-image: var(--taffy-q-settings);\r\n  background-position: center;\r\n  background-size: 122% 122%;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready][data-taffy-sidebar-size='rail'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand'])::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready][data-taffy-sidebar-size='rail'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand'])::after {\r\n  background-image: var(--taffy-q-new);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='打开侧边栏']::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Open sidebar']::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='收起侧边栏']::after,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Collapse sidebar']::after {\r\n  background-image: var(--taffy-q-brand-right);\r\n  background-position: center;\r\n  background-size: 122% 122%;\r\n}\r\n\r\nbody[data-dsh-taffy-theme]:not([data-taffy-sidebar-size='rail']) [data-slot='sidebar.settings'] > :is(button, [role='button']),\r\nbody[data-dsh-taffy-theme]:not([data-taffy-sidebar-size='rail']) [data-slot='sidebar.settings'] button[aria-haspopup='dialog'],\r\nbody[data-dsh-taffy-theme]:not([data-taffy-sidebar-size='rail']) :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']),\r\nbody[data-dsh-taffy-theme]:not([data-taffy-sidebar-size='rail']) :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand']) {\r\n  position: relative;\r\n  z-index: 1;\r\n  box-sizing: border-box;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  gap: 8px;\r\n  width: 100%;\r\n  min-width: 0;\r\n  min-height: 56px;\r\n  height: auto;\r\n  padding: 8px 16px;\r\n  overflow: hidden;\r\n  border-radius: 14px;\r\n  color: var(--ds-taffy-text);\r\n  background: var(--taffy-plate-art);\r\n  border: 1px solid color-mix(in srgb, var(--ds-taffy-pink) 26%, transparent);\r\n  box-shadow: none;\r\n  filter: none;\r\n  font-size: 14px;\r\n  line-height: 1.2;\r\n  opacity: 1;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme]:not([data-taffy-sidebar-size='rail']) [data-slot='sidebar.settings'] > :is(button, [role='button']),\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme]:not([data-taffy-sidebar-size='rail']) [data-slot='sidebar.settings'] button[aria-haspopup='dialog'],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night']:not([data-taffy-sidebar-size='rail']) [data-slot='sidebar.settings'] > :is(button, [role='button']),\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night']:not([data-taffy-sidebar-size='rail']) [data-slot='sidebar.settings'] button[aria-haspopup='dialog'],\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme]:not([data-taffy-sidebar-size='rail']) :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']),\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme]:not([data-taffy-sidebar-size='rail']) :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand']),\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night']:not([data-taffy-sidebar-size='rail']) :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']),\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night']:not([data-taffy-sidebar-size='rail']) :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand']) {\r\n  color: var(--ds-taffy-text-on-dark);\r\n  background: var(--taffy-plate-art);\r\n  border-color: color-mix(in srgb, var(--ds-taffy-pink) 28%, transparent);\r\n}\r\n\r\nbody[data-dsh-taffy-theme]:not([data-taffy-sidebar-size='rail']) [data-slot='sidebar.settings'] button[aria-haspopup='dialog']:hover,\r\nbody[data-dsh-taffy-theme]:not([data-taffy-sidebar-size='rail']) :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']):hover,\r\nbody[data-dsh-taffy-theme]:not([data-taffy-sidebar-size='rail']) :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand']):hover {\r\n  filter: brightness(1.06);\r\n}\r\n\r\nbody[data-dsh-taffy-theme]:not([data-taffy-sidebar-size='rail']) [data-slot='sidebar.settings'] button[aria-haspopup='dialog']:active,\r\nbody[data-dsh-taffy-theme]:not([data-taffy-sidebar-size='rail']) :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']):active,\r\nbody[data-dsh-taffy-theme]:not([data-taffy-sidebar-size='rail']) :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand']):active {\r\n  filter: brightness(0.98);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready]:not([data-taffy-sidebar-size='rail']) [data-slot='sidebar.settings'] > :is(button, [role='button'])::before,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready]:not([data-taffy-sidebar-size='rail']) [data-slot='sidebar.settings'] button[aria-haspopup='dialog']::before,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready]:not([data-taffy-sidebar-size='rail']) :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand'])::before,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready]:not([data-taffy-sidebar-size='rail']) :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand'])::before {\r\n  content: '';\r\n  flex: 0 0 36px;\r\n  box-sizing: border-box;\r\n  width: 36px;\r\n  height: 36px;\r\n  min-width: 36px;\r\n  min-height: 36px;\r\n  aspect-ratio: 1;\r\n  padding: 0;\r\n  border-radius: 50%;\r\n  overflow: hidden;\r\n  pointer-events: none;\r\n  background-repeat: no-repeat;\r\n  background-position: center;\r\n  background-size: 118% 118%;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready]:not([data-taffy-sidebar-size='rail']) [data-slot='sidebar.settings'] > :is(button, [role='button'])::before,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready]:not([data-taffy-sidebar-size='rail']) [data-slot='sidebar.settings'] button[aria-haspopup='dialog']::before {\r\n  flex: 0 0 44px;\r\n  width: 44px;\r\n  height: 44px;\r\n  min-width: 44px;\r\n  min-height: 44px;\r\n  background-image: var(--taffy-q-settings);\r\n  background-position: center;\r\n  background-size: 122% 122%;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready]:not([data-taffy-sidebar-size='rail']) :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand'])::before,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready]:not([data-taffy-sidebar-size='rail']) :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand'])::before {\r\n  background-image: var(--taffy-q-new);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready]:not([data-taffy-sidebar-size='rail']) [data-slot='sidebar.settings'] button[aria-haspopup='dialog'] svg,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready]:not([data-taffy-sidebar-size='rail']) :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']) > svg,\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready]:not([data-taffy-sidebar-size='rail']) :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand']) > svg {\r\n  position: absolute;\r\n  width: 0;\r\n  height: 0;\r\n  opacity: 0;\r\n  overflow: hidden;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[class*='brand'] {\r\n  position: relative;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: flex-start;\r\n  gap: 10px;\r\n  min-height: 56px;\r\n  overflow: hidden;\r\n  font-size: 0;\r\n  line-height: 0;\r\n  color: var(--ds-taffy-pink);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[class*='brand'] > * {\r\n  font-size: 0;\r\n  line-height: 0;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] :is([data-pane='sidebar'], [class*='sidebarCol']) button[class*='brand'] :is(svg, img) {\r\n  position: absolute;\r\n  width: 0;\r\n  height: 0;\r\n  opacity: 0;\r\n  overflow: hidden;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-q-ready] :is([data-pane='sidebar'], [class*='sidebarCol']) button[class*='brand']::before {\r\n  content: '';\r\n  flex: 0 0 56px;\r\n  box-sizing: border-box;\r\n  width: 56px;\r\n  height: 56px;\r\n  min-width: 56px;\r\n  min-height: 56px;\r\n  aspect-ratio: 1;\r\n  border-radius: 50%;\r\n  overflow: hidden;\r\n  pointer-events: none;\r\n  background-image: var(--taffy-q-brand);\r\n  background-repeat: no-repeat;\r\n  background-position: center;\r\n  background-size: 122% 122%;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[class*='brand']::after {\r\n  content: 'taffy-harness';\r\n  flex: 0 0 auto;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  min-height: 56px;\r\n  font-size: 16px;\r\n  font-weight: 700;\r\n  line-height: 1.1;\r\n  letter-spacing: 0.03em;\r\n  color: var(--ds-taffy-pink);\r\n  text-shadow: 0 0 10px color-mix(in srgb, var(--ds-taffy-pink) 45%, transparent);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button,\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-composer-card] button,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [class*='centerCol'] button,\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [class*='centerCol'] button,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [class*='sidebarCol'] button,\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [class*='sidebarCol'] button {\r\n  color: color-mix(in srgb, var(--ds-taffy-gold) 58%, var(--ds-taffy-pink));\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button svg,\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-composer-card] button svg,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [class*='centerCol'] button svg,\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [class*='centerCol'] button svg,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [class*='sidebarCol'] button svg,\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [class*='sidebarCol'] button svg {\r\n  color: color-mix(in srgb, var(--ds-taffy-gold) 62%, var(--ds-taffy-pink));\r\n  stroke: currentColor;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='发送消息']:focus-visible,\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='Send message']:focus-visible,\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='停止生成']:focus-visible,\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='Stop generating']:focus-visible,\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='命令']:focus-visible,\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='Commands']:focus-visible,\r\nbody[data-dsh-taffy-theme] [data-slot='sidebar.settings'] button[aria-haspopup='dialog']:focus-visible,\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']):focus-visible,\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand']):focus-visible,\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='打开侧边栏']:focus-visible,\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Open sidebar']:focus-visible,\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='收起侧边栏']:focus-visible,\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Collapse sidebar']:focus-visible {\r\n  outline: 2px solid var(--ds-taffy-pink);\r\n  outline-offset: 2px;\r\n}\r\n\r\n/* Dark chrome: keep labeled rows on the sidebar fill, no extra glow plate. */\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-slot='sidebar.settings'] > :is(button, [role='button']),\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-slot='sidebar.settings'] button[aria-haspopup='dialog'],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-slot='sidebar.settings'] > :is(button, [role='button']),\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-slot='sidebar.settings'] button[aria-haspopup='dialog'],\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']),\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand']),\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']),\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand']) {\r\n  box-shadow: none;\r\n  filter: none;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='发送消息'],\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='Send message'],\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='停止生成'],\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='Stop generating'],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-composer-card] button[aria-label='发送消息'],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-composer-card] button[aria-label='Send message'],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-composer-card] button[aria-label='停止生成'],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-composer-card] button[aria-label='Stop generating'] {\r\n  border: 1px solid rgba(242, 165, 200, 0.48);\r\n  box-shadow:\r\n    inset 0 1px rgba(255, 244, 250, 0.16),\r\n    0 0 12px rgba(242, 165, 200, 0.26);\r\n  transition: box-shadow 140ms ease, border-color 140ms ease, filter 140ms ease, transform 140ms ease;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='打开侧边栏'],\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Open sidebar'],\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='收起侧边栏'],\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Collapse sidebar'],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='打开侧边栏'],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Open sidebar'],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='收起侧边栏'],\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Collapse sidebar'] {\r\n  border: 1px solid rgba(185, 167, 232, 0.32);\r\n  box-shadow:\r\n    inset 0 1px rgba(255, 244, 250, 0.1),\r\n    0 0 8px rgba(242, 165, 200, 0.14);\r\n  transition: box-shadow 140ms ease, border-color 140ms ease, filter 140ms ease, transform 140ms ease;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-slot='sidebar.settings'] button[aria-haspopup='dialog']:hover,\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-slot='sidebar.settings'] button[aria-haspopup='dialog']:hover,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']):hover,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand']):hover,\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']):hover,\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand']):hover {\r\n  filter: brightness(1.08);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='发送消息']:hover,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='Send message']:hover,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='停止生成']:hover,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='Stop generating']:hover,\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-composer-card] button[aria-label='发送消息']:hover,\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-composer-card] button[aria-label='Send message']:hover,\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-composer-card] button[aria-label='停止生成']:hover,\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] [data-composer-card] button[aria-label='Stop generating']:hover {\r\n  border-color: rgba(255, 205, 225, 0.82);\r\n  filter: brightness(1.1);\r\n  box-shadow:\r\n    inset 0 1px rgba(255, 255, 255, 0.24),\r\n    0 0 18px rgba(242, 165, 200, 0.32);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='打开侧边栏']:hover,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Open sidebar']:hover,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='收起侧边栏']:hover,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Collapse sidebar']:hover,\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='打开侧边栏']:hover,\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Open sidebar']:hover,\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='收起侧边栏']:hover,\r\nbody[data-dsh-taffy-theme][data-taffy-preset='taffy-night'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Collapse sidebar']:hover {\r\n  border-color: rgba(255, 205, 225, 0.62);\r\n  filter: brightness(1.06);\r\n  box-shadow:\r\n    inset 0 1px rgba(255, 255, 255, 0.16),\r\n    0 0 12px rgba(242, 165, 200, 0.22);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-slot='sidebar.settings'] button[aria-haspopup='dialog']:active,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']):active,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand']):active,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='发送消息']:active,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='Send message']:active,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='停止生成']:active,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='Stop generating']:active,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='打开侧边栏']:active,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Open sidebar']:active,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='收起侧边栏']:active,\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Collapse sidebar']:active {\r\n  transform: scale(1.02);\r\n  box-shadow:\r\n    inset 0 2px 6px rgba(8, 4, 16, 0.42),\r\n    0 0 8px rgba(242, 165, 200, 0.16);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-low-power][data-ds-dark-theme] [data-slot='sidebar.settings'] button,\r\nbody[data-dsh-taffy-theme][data-taffy-low-power][data-ds-dark-theme] [data-composer-card] button[aria-label='发送消息'],\r\nbody[data-dsh-taffy-theme][data-taffy-low-power][data-ds-dark-theme] [data-composer-card] button[aria-label='Send message'],\r\nbody[data-dsh-taffy-theme][data-taffy-low-power][data-ds-dark-theme] [data-composer-card] button[aria-label='停止生成'],\r\nbody[data-dsh-taffy-theme][data-taffy-low-power][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']),\r\nbody[data-dsh-taffy-theme][data-taffy-low-power][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='收起侧边栏'],\r\nbody[data-dsh-taffy-theme][data-taffy-low-power][data-ds-dark-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='打开侧边栏'],\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-reduced-motion='true'][data-ds-dark-theme] [data-slot='sidebar.settings'] button,\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-reduced-motion='true'][data-ds-dark-theme] [data-composer-card] button[aria-label='发送消息'],\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-reduced-motion='true'][data-ds-dark-theme] [data-composer-card] button[aria-label='Send message'] {\r\n  box-shadow: none;\r\n  filter: none;\r\n  animation: none;\r\n  transition: none;\r\n}\r\n\r\n@media (max-width: 900px) {\r\n  body[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='发送消息'],\r\n  body[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='Send message'],\r\n  body[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='停止生成'] {\r\n    box-shadow:\r\n      inset 0 1px rgba(255, 244, 250, 0.12),\r\n      0 0 8px rgba(242, 165, 200, 0.16);\r\n  }\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  body[data-dsh-taffy-theme][data-ds-dark-theme] [data-slot='sidebar.settings'] button,\r\n  body[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='发送消息'],\r\n  body[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='Send message'] {\r\n    box-shadow: none;\r\n    animation: none;\r\n    transition: none;\r\n  }\r\n}\r\n";
		const motionCss = "body[data-dsh-taffy-theme][data-taffy-viewport-resizing] [data-taffy-character],\r\nbody[data-dsh-taffy-theme][data-taffy-viewport-resizing] [data-skin-chrome='atelier-frame'],\r\nbody[data-dsh-taffy-theme][data-taffy-viewport-resizing] [data-skin-chrome='sidebar-trim'] {\r\n  transition: none;\r\n  filter: none;\r\n  animation: none;\r\n}\r\n\r\n@keyframes taffy-q-pop {\r\n  0%, 100% { transform: scale(1); }\r\n  50% { transform: scale(1.08); }\r\n}\r\n\r\n@keyframes taffy-idle-sway {\r\n  0%, 100% { transform: translateY(0) rotate(0deg); }\r\n  50% { transform: translateY(-7px) rotate(0.35deg); }\r\n}\r\n\r\n@keyframes taffy-sparkle-drift {\r\n  0%, 100% { background-position: 12% 18%, 78% 32%, 42% 72%; opacity: 0.42; }\r\n  50% { background-position: 18% 28%, 70% 24%, 48% 64%; opacity: 0.68; }\r\n}\r\n\r\n@keyframes taffy-send-glow {\r\n  0%, 100% {\r\n    box-shadow:\r\n      inset 0 1px rgba(255, 255, 255, 0.62),\r\n      0 6px 16px rgba(220, 111, 158, 0.18);\r\n  }\r\n  50% {\r\n    box-shadow:\r\n      inset 0 1px rgba(255, 255, 255, 0.72),\r\n      0 8px 18px rgba(220, 111, 158, 0.28);\r\n  }\r\n}\r\n\r\n@keyframes taffy-breathe {\r\n  0%, 100% { filter: drop-shadow(0 0 0 transparent); }\r\n  50% { filter: drop-shadow(0 0 8px color-mix(in srgb, var(--ds-taffy-pink) 45%, transparent)); }\r\n}\r\n\r\n@keyframes taffy-veil-breathe {\r\n  0%, 100% { filter: saturate(1); }\r\n  50% { filter: saturate(1.04); }\r\n}\r\n\r\n@keyframes taffy-status-flash {\r\n  0% { filter: drop-shadow(0 0 0 transparent); }\r\n  40% { filter: drop-shadow(0 0 8px color-mix(in srgb, var(--ds-taffy-gold) 70%, transparent)); }\r\n  100% { filter: drop-shadow(0 0 0 transparent); }\r\n}\r\n\r\n@keyframes taffy-error-pulse {\r\n  0% { filter: drop-shadow(0 0 0 transparent); }\r\n  40% { filter: drop-shadow(0 0 8px color-mix(in srgb, var(--ds-taffy-ribbon) 60%, transparent)); }\r\n  100% { filter: drop-shadow(0 0 0 transparent); }\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-state='idle'] [data-taffy-veil='curtain'] {\r\n  animation: taffy-veil-breathe calc(10s * var(--taffy-motion-duration, 1)) ease-in-out infinite;\r\n}\r\n\r\nbody[data-dsh-taffy-theme]:not([data-taffy-low-power]):not([data-dsh-taffy-motion='off']):not([data-dsh-taffy-reduced-motion='true']) [data-taffy-character] {\r\n  animation: taffy-idle-sway calc(5.6s * var(--taffy-motion-duration, 1)) ease-in-out infinite;\r\n}\r\n\r\nbody[data-dsh-taffy-theme]:not([data-taffy-low-power]):not([data-dsh-taffy-motion='off']):not([data-dsh-taffy-reduced-motion='true']) [data-taffy-character='right'] {\r\n  animation-duration: calc(6.4s * var(--taffy-motion-duration, 1));\r\n  animation-delay: -1.8s;\r\n}\r\n\r\nbody[data-dsh-taffy-theme]:not([data-taffy-low-power]):not([data-dsh-taffy-motion='off']):not([data-dsh-taffy-reduced-motion='true']) [data-taffy-sparkles] {\r\n  animation: taffy-sparkle-drift calc(9s * var(--taffy-motion-duration, 1)) ease-in-out infinite;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='发送消息'],\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='Send message'] {\r\n  animation: taffy-send-glow calc(2.8s * var(--taffy-motion-duration, 1)) ease-in-out infinite;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='发送消息']:hover:not(:disabled),\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='Send message']:hover:not(:disabled) {\r\n  transform: scale(1.02);\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='发送消息']:active:not(:disabled),\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='Send message']:active:not(:disabled) {\r\n  transform: scale(1.02);\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-state='thinking'] [data-skin-chrome='atelier-frame'] {\r\n  animation: taffy-breathe 1.8s ease-in-out infinite;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-state='success'] [data-skin-chrome='atelier-frame'] {\r\n  animation: taffy-status-flash 700ms ease-out 1;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-taffy-state='error'] [data-skin-chrome='atelier-frame'] {\r\n  animation: taffy-error-pulse 700ms ease-out 1;\r\n}\r\n\r\nbody[data-dsh-taffy-theme] [data-slot='sidebar.settings'] button[aria-haspopup='dialog']:hover::before,\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[class*='brand']:hover::before,\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='命令']:hover::after,\r\nbody[data-dsh-taffy-theme] [data-composer-card] button[aria-label='Commands']:hover::after,\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='打开侧边栏']:hover::after,\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Open sidebar']:hover::after,\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='收起侧边栏']:hover::after,\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='Collapse sidebar']:hover::after,\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']):hover::before,\r\nbody[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand']):hover::before {\r\n  animation: taffy-q-pop 0.45s ease;\r\n}\r\n\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-motion='off'] [data-taffy-character],\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-reduced-motion='true'] [data-taffy-character],\r\nbody[data-dsh-taffy-theme][data-taffy-low-power] [data-taffy-character],\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-motion='off'] [data-taffy-sparkles],\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-reduced-motion='true'] [data-taffy-sparkles],\r\nbody[data-dsh-taffy-theme][data-taffy-low-power] [data-taffy-sparkles],\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-motion='off'] [data-composer-card] button[aria-label='发送消息'],\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-motion='off'] [data-composer-card] button[aria-label='Send message'],\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-reduced-motion='true'] [data-composer-card] button[aria-label='发送消息'],\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-reduced-motion='true'] [data-composer-card] button[aria-label='Send message'],\r\nbody[data-dsh-taffy-theme][data-taffy-low-power] [data-composer-card] button[aria-label='发送消息'],\r\nbody[data-dsh-taffy-theme][data-taffy-low-power] [data-composer-card] button[aria-label='Send message'],\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='发送消息'],\r\nbody[data-dsh-taffy-theme][data-ds-dark-theme] [data-composer-card] button[aria-label='Send message'],\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-motion='off'] [data-taffy-veil='curtain'],\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-reduced-motion='true'] [data-taffy-veil='curtain'],\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-motion='off'] [data-skin-chrome='atelier-frame'],\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-reduced-motion='true'] [data-skin-chrome='atelier-frame'],\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-motion='off'] [data-slot='sidebar.settings'] button[aria-haspopup='dialog']:hover::before,\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-reduced-motion='true'] [data-slot='sidebar.settings'] button[aria-haspopup='dialog']:hover::before,\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-motion='off'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[class*='brand']:hover::before,\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-reduced-motion='true'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[class*='brand']:hover::before,\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-motion='off'] [data-composer-card] button[aria-label='命令']:hover::after,\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-reduced-motion='true'] [data-composer-card] button[aria-label='命令']:hover::after,\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-motion='off'] [data-composer-card] button[aria-label='Commands']:hover::after,\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-reduced-motion='true'] [data-composer-card] button[aria-label='Commands']:hover::after,\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-motion='off'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']):hover::before,\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-reduced-motion='true'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']):hover::before,\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-motion='off'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand']):hover::before,\r\nbody[data-dsh-taffy-theme][data-dsh-taffy-reduced-motion='true'] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand']):hover::before {\r\n  animation: none;\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  body[data-dsh-taffy-theme] [data-taffy-character],\r\n  body[data-dsh-taffy-theme] [data-taffy-veil='curtain'],\r\n  body[data-dsh-taffy-theme] [data-skin-chrome],\r\n  body[data-dsh-taffy-theme] [data-composer-card] button[aria-label='发送消息'],\r\n  body[data-dsh-taffy-theme] [data-composer-card] button[aria-label='Send message'],\r\n  body[data-dsh-taffy-theme] [data-slot='sidebar.settings'] button[aria-haspopup='dialog']:hover::before,\r\n  body[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[class*='brand']:hover::before,\r\n  body[data-dsh-taffy-theme] [data-composer-card] button[aria-label='命令']:hover::before,\r\n  body[data-dsh-taffy-theme] [data-composer-card] button[aria-label='Commands']:hover::before,\r\n  body[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand']):hover::before,\r\n  body[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='New session']:not([class*='brand']):hover::before {\r\n    animation: none;\r\n    transition: none;\r\n  }\r\n}\r\n";
		//#endregion
		//#region src/client/styles.ts
		const STYLE_ID = "dsh-taffy-theme-style";
		const THEME_CSS = `${tokensCss}\n${surfacesCss}\n${badgesCss}\n${componentsCss}\n${motionCss}`;
		function ensureStyleNode(doc) {
			const existing = doc.getElementById(STYLE_ID);
			if (existing instanceof HTMLStyleElement) {
				existing.textContent = THEME_CSS;
				return existing;
			}
			const style = doc.createElement("style");
			style.id = STYLE_ID;
			style.setAttribute("data-dsh-taffy-theme", "style");
			style.setAttribute("data-plugin-css", "@dsh-external/dsh-taffy-theme");
			style.textContent = THEME_CSS;
			doc.head.append(style);
			return style;
		}
		function removeStyleNode(doc) {
			doc.getElementById(STYLE_ID)?.remove();
		}
		//#endregion
		//#region src/client/chrome-selectors.ts
		/** DSH public DOM API selectors — single source of truth for chrome hooks. */
		const SKIN_OWNER = "dsh-taffy-theme";
		const SIDEBAR_SELECTOR = ":is([data-pane='sidebar'], [class*='sidebarCol'])";
		const DETAILS_SELECTOR = ":is([data-pane='details'], [class*='detailsCol'], [class*='_explorer']:not([class*='Body']):not([class*='body']))";
		const CONVERSATION_SELECTOR = ":is([data-pane='conversation'], [class*='centerCol'])";
		const HERO_SELECTOR = "[data-phase='hero']";
		const ACTIVE_SELECTOR = "[data-phase='active']";
		const CHAT_FLOW_SELECTOR = "[data-chat-flow]";
		const CONVERSATION_SCROLL_SELECTOR = "[data-conversation-scroll]";
		const COMPOSER_OVERLAY_SELECTOR = "[data-conversation-composer-overlay]";
		const COMPOSER_CARD_SELECTOR = "[data-composer-card]";
		const SETTINGS_DIALOG_SELECTOR = "[data-slot='sidebar.settings'] [role='dialog'][aria-modal='true']";
		const WORKSPACE_SELECTOR = "header [role='tablist']";
		const BETTER_SIDEBAR_SELECTOR = "[data-dsh-better-sidebar]";
		const RIGHT_DOCK_SELECTOR = [
			DETAILS_SELECTOR,
			BETTER_SIDEBAR_SELECTOR,
			"[data-dsh-floating-panel]",
			"[data-plugin-root]"
		].join(", ");
		const TOOL_CALL_SELECTOR = "[data-tool-call]";
		const STREAMING_SELECTOR = "[data-streaming=\"true\"]";
		//#endregion
		//#region src/client/metrics-stamp.ts
		const METRICS_OPT_OUT_KEY = "dsh-taffy-theme:metrics";
		const MISS_GRACE_MS = 3e3;
		let enabledGetter = () => true;
		let selectorWarned = false;
		let mountedAt = 0;
		function setMetricsEnabledGetter(getter) {
			enabledGetter = getter;
		}
		function metricsStampingEnabled() {
			try {
				return localStorage.getItem(METRICS_OPT_OUT_KEY) !== "0";
			} catch {
				return true;
			}
		}
		function selectorMisses(doc) {
			const misses = [];
			const required = [
				["SIDEBAR_SELECTOR", SIDEBAR_SELECTOR],
				["COMPOSER_CARD_SELECTOR", COMPOSER_CARD_SELECTOR],
				["CONVERSATION_SELECTOR", CONVERSATION_SELECTOR]
			];
			for (const [name, selector] of required) if (!doc.querySelector(selector)) misses.push(name);
			if (doc.querySelector("[data-phase='hero']") === null && doc.querySelector("[data-phase='active']") === null) misses.push("PHASE_SELECTOR");
			if (doc.querySelector("[data-phase='active']") !== null) {
				if (!(doc.querySelector(`[data-phase='active'] [data-chat-flow]`) ?? doc.querySelector("[data-chat-flow]"))) misses.push("CHAT_FLOW_SELECTOR");
			}
			return misses;
		}
		function parsePx(value) {
			const parsed = Number.parseFloat(value);
			return Number.isFinite(parsed) ? parsed : 0;
		}
		function readMetricsFromBody(body, enabled, scene) {
			const view = body.ownerDocument.defaultView;
			const computed = view?.getComputedStyle(body);
			const frameWidth = parsePx(computed?.getPropertyValue("--taffy-frame-width") ?? "0");
			const frameHeight = parsePx(computed?.getPropertyValue("--taffy-frame-height") ?? "0");
			let phase = "unknown";
			if (body.querySelector("[data-phase='hero']")) phase = "hero";
			else if (body.querySelector("[data-phase='active']")) phase = "active";
			return {
				scene,
				at: (/* @__PURE__ */ new Date()).toISOString(),
				enabled,
				selectorMisses: selectorMisses(body.ownerDocument),
				frameWidth: Math.round(frameWidth),
				frameHeight: Math.round(frameHeight),
				frameHidden: body.hasAttribute("data-taffy-frame-hidden"),
				frameCompact: body.hasAttribute("data-taffy-frame-compact"),
				phase,
				viewportWidth: view?.innerWidth ?? 0,
				viewportHeight: view?.innerHeight ?? 0
			};
		}
		function stampMetrics(doc, body, scene) {
			if (!metricsStampingEnabled()) return;
			const node = doc.getElementById(STYLE_ID);
			if (!(node instanceof HTMLStyleElement)) return;
			const payload = readMetricsFromBody(body, enabledGetter(), scene);
			node.setAttribute("data-taffy-metrics", JSON.stringify(payload));
			maybeWarnSelectorMisses(doc, payload.enabled);
		}
		function maybeWarnSelectorMisses(doc, enabled) {
			if (!enabled || selectorWarned) return;
			if (Date.now() - mountedAt < MISS_GRACE_MS) return;
			const misses = selectorMisses(doc);
			if (misses.length === 0) return;
			console.warn("[dsh-taffy-theme] selector miss:", misses.join(", "));
			selectorWarned = true;
		}
		function clearMetricsStamp(doc) {
			doc.getElementById(STYLE_ID)?.removeAttribute("data-taffy-metrics");
		}
		function resetMetricsStampState() {
			selectorWarned = false;
			mountedAt = Date.now();
		}
		const PLUGIN_ASSET_BASE = `/plugins/@dsh-external/dsh-taffy-theme/assets/taffy`;
		/** Bumped when shipped art changes so browsers skip the 24h asset cache. */
		const ASSET_SET_VERSION = "2026-08-22-fill-q";
		function buildAssetUrl(relativePath) {
			const clean = relativePath.replace(/^\/+/, "");
			return `${PLUGIN_ASSET_BASE}/${clean}?v=${ASSET_SET_VERSION}`;
		}
		//#endregion
		//#region src/client/bundled-assets.ts
		/** Default stage art URLs — served from the plugin assets directory, not inlined in client.js. */
		const BUNDLED_AVATAR = buildAssetUrl("avatar.webp");
		const BUNDLED_AVATAR_NIGHT = buildAssetUrl("avatar-night.webp");
		const BUNDLED_PORTRAIT = buildAssetUrl("portrait.webp");
		const BUNDLED_WALLPAPER_LIGHT = buildAssetUrl("wallpaper-light.webp");
		const BUNDLED_WALLPAPER_DARK = buildAssetUrl("wallpaper-dark.webp");
		const BUNDLED_LEFT_LIGHT = buildAssetUrl("left-light.webp");
		const BUNDLED_RIGHT_LIGHT = buildAssetUrl("right-light.webp");
		const BUNDLED_LEFT_DARK = buildAssetUrl("left-dark.webp");
		const BUNDLED_RIGHT_DARK = buildAssetUrl("right-dark.webp");
		//#endregion
		//#region src/client/bundled-q.ts
		/** Q chrome headshot URLs — served from assets/taffy/icons, not inlined in client.js. */
		const BUNDLED_Q_FACE = buildAssetUrl("icons/face-look.webp");
		const BUNDLED_Q_SEND = buildAssetUrl("icons/face-happy.webp");
		const BUNDLED_Q_STOP = buildAssetUrl("icons/face-stop.webp");
		const BUNDLED_Q_NEW = buildAssetUrl("icons/face-new.webp");
		const BUNDLED_Q_SETTINGS = buildAssetUrl("icons/face-wink.webp");
		const BUNDLED_Q_BRAND = buildAssetUrl("icons/face-look.webp");
		const BUNDLED_Q_BRAND_RIGHT = buildAssetUrl("icons/face-pet.webp");
		const BUNDLED_Q_COMMAND = buildAssetUrl("icons/face-portrait.webp");
		//#endregion
		//#region src/assets/resolve.ts
		function isNightScene(root = document.body) {
			return root.hasAttribute("data-ds-dark-theme") || root.getAttribute("data-taffy-preset") === "taffy-night";
		}
		function pickImage(candidate, fallback) {
			return candidate && isAllowedImageProtocol(candidate) ? candidate : fallback;
		}
		function resolveAvatarUrl(settings, custom, night = isNightScene()) {
			const fallback = night && BUNDLED_AVATAR_NIGHT ? BUNDLED_AVATAR_NIGHT : BUNDLED_AVATAR;
			return pickImage(custom?.avatar ?? (settings.avatar !== "default" ? settings.avatar : void 0) ?? fallback, fallback);
		}
		function resolvePortraitUrl(settings, custom) {
			if (settings.portrait === "off") return null;
			return pickImage(custom?.portrait ?? (settings.portrait !== "default" ? settings.portrait : void 0) ?? BUNDLED_PORTRAIT, BUNDLED_PORTRAIT);
		}
		function resolveWallpaperUrl(night) {
			const candidate = night ? BUNDLED_WALLPAPER_DARK : BUNDLED_WALLPAPER_LIGHT;
			return candidate && isAllowedImageProtocol(candidate) ? candidate : "";
		}
		function resolvePortraitFallback() {
			return pickImage(BUNDLED_PORTRAIT, BUNDLED_AVATAR);
		}
		function resolveFigureUrls(night) {
			const left = night ? BUNDLED_LEFT_DARK : BUNDLED_LEFT_LIGHT;
			const right = night ? BUNDLED_RIGHT_DARK : BUNDLED_RIGHT_LIGHT;
			return {
				left: pickImage(left, BUNDLED_PORTRAIT),
				right: pickImage(right, BUNDLED_PORTRAIT)
			};
		}
		function resolveQChromeUrls(settings) {
			const avatar = resolveAvatarUrl(settings);
			const portrait = resolvePortraitUrl(settings) ?? avatar;
			return {
				face: pickImage(BUNDLED_Q_FACE, avatar),
				send: pickImage(BUNDLED_Q_SEND, avatar),
				stop: pickImage(BUNDLED_Q_STOP, avatar),
				newSession: pickImage(BUNDLED_Q_NEW, avatar),
				settings: pickImage(BUNDLED_Q_SETTINGS, avatar),
				brand: pickImage(BUNDLED_Q_BRAND, portrait),
				brandRight: pickImage(BUNDLED_Q_BRAND_RIGHT, portrait),
				command: pickImage(BUNDLED_Q_COMMAND, portrait)
			};
		}
		//#endregion
		//#region src/client/performance.ts
		/** When true, disable blur-heavy acrylic and extra motion work. */
		function shouldUseLowPower(settings) {
			if (settings.reducedMotion || settings.motion === "off") return true;
			if (typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
			const nav = navigator;
			if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4 && typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) return true;
			return false;
		}
		//#endregion
		//#region src/client/mount.ts
		const ROOT_ATTR = "data-dsh-taffy-theme";
		const Q_VARS = [
			"--taffy-q-face",
			"--taffy-q-send",
			"--taffy-q-stop",
			"--taffy-q-new",
			"--taffy-q-settings",
			"--taffy-q-brand",
			"--taffy-q-brand-right",
			"--taffy-q-command"
		];
		function tagChrome(node, chrome) {
			node.dataset.skinOwner = SKIN_OWNER;
			node.dataset.skinChrome = chrome;
			node.setAttribute("aria-hidden", "true");
			return node;
		}
		function bindAssetFallback(image, fallbackSrc) {
			image.addEventListener("error", () => {
				const current = image.getAttribute("src") ?? "";
				if (fallbackSrc && current !== fallbackSrc) {
					delete image.dataset.taffyAssetError;
					image.src = fallbackSrc;
					return;
				}
				image.dataset.taffyAssetError = "";
			});
			image.addEventListener("load", () => {
				delete image.dataset.taffyAssetError;
			});
		}
		function applyImageSrc(image, src) {
			delete image.dataset.taffyAssetError;
			if (image.getAttribute("src") === src) return;
			image.src = src;
		}
		function makeImage(src, character, pose) {
			const image = document.createElement("img");
			image.dataset.skinOwner = SKIN_OWNER;
			image.dataset.taffyCharacter = character;
			image.dataset.taffyPose = pose;
			image.alt = "";
			image.decoding = "async";
			bindAssetFallback(image, resolvePortraitFallback());
			applyImageSrc(image, src);
			return image;
		}
		function scenePoses(night) {
			return night ? {
				left: "bust",
				right: "sit"
			} : {
				left: "sit",
				right: "stand"
			};
		}
		function makeMascot(src) {
			const image = document.createElement("img");
			image.dataset.skinOwner = SKIN_OWNER;
			image.dataset.taffyMascot = "sidebar";
			image.alt = "";
			image.decoding = "async";
			bindAssetFallback(image, resolvePortraitFallback());
			applyImageSrc(image, src);
			return image;
		}
		const Q_PRELOAD_TIMEOUT_MS = 12e3;
		function preloadImage(url, timeoutMs = Q_PRELOAD_TIMEOUT_MS) {
			if (!url || url === "none") return Promise.resolve(false);
			if (url.startsWith("data:image/")) return Promise.resolve(true);
			return new Promise((resolve) => {
				const image = new Image();
				let settled = false;
				const finish = (ok) => {
					if (settled) return;
					settled = true;
					window.clearTimeout(timer);
					resolve(ok);
				};
				const timer = window.setTimeout(() => finish(false), timeoutMs);
				image.onload = () => finish(true);
				image.onerror = () => finish(false);
				image.src = url;
			});
		}
		let qChromeEpoch = 0;
		function applyQChromeVars(body, settings) {
			const epoch = ++qChromeEpoch;
			const q = resolveQChromeUrls(settings);
			const entries = [
				["--taffy-q-face", q.face],
				["--taffy-q-send", q.send],
				["--taffy-q-stop", q.stop],
				["--taffy-q-new", q.newSession],
				["--taffy-q-settings", q.settings],
				["--taffy-q-brand", q.brand],
				["--taffy-q-brand-right", q.brandRight],
				["--taffy-q-command", q.command]
			];
			body.removeAttribute("data-taffy-q-ready");
			for (const [key] of entries) body.style.setProperty(key, "none");
			Promise.all(entries.map(async ([key, url]) => {
				const ok = await preloadImage(url);
				if (epoch !== qChromeEpoch) return false;
				body.style.setProperty(key, ok ? `url("${url}")` : "none");
				return ok;
			})).then((loaded) => {
				if (epoch !== qChromeEpoch) return;
				if (loaded.every(Boolean)) body.setAttribute("data-taffy-q-ready", "");
			});
		}
		function applyRootAttributes(body, settings, state) {
			if (!settings.enabled) {
				body.removeAttribute(ROOT_ATTR);
				body.removeAttribute("data-taffy-state");
				body.removeAttribute("data-taffy-preset");
				body.removeAttribute("data-dsh-taffy-intensity");
				body.removeAttribute("data-dsh-taffy-motion");
				body.removeAttribute("data-dsh-taffy-reduced-motion");
				body.removeAttribute("data-taffy-veil");
				body.removeAttribute("data-taffy-acrylic-percent");
				body.removeAttribute("data-taffy-frame-opacity");
				body.removeAttribute("data-taffy-panel-opacity");
				body.removeAttribute("data-taffy-character-opacity");
				body.removeAttribute("data-taffy-scene");
				body.removeAttribute("data-taffy-hide-left");
				body.removeAttribute("data-taffy-hide-right");
				body.removeAttribute("data-taffy-hide-mascot");
				body.removeAttribute("data-taffy-q-ready");
				body.removeAttribute("data-taffy-low-power");
				clearOpacityVars(body);
				return;
			}
			body.setAttribute(ROOT_ATTR, "");
			body.setAttribute("data-taffy-state", state);
			body.setAttribute("data-taffy-preset", settings.colors.preset);
			body.setAttribute("data-dsh-taffy-intensity", settings.colors.dynamicIntensity);
			body.setAttribute("data-dsh-taffy-motion", settings.motion === "off" ? "off" : "standard");
			body.setAttribute("data-dsh-taffy-reduced-motion", settings.reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "true" : "false");
			body.setAttribute("data-taffy-veil", veilBucket(settings));
			body.setAttribute("data-taffy-acrylic-percent", String(settings.acrylicPercent));
			body.setAttribute("data-taffy-frame-opacity", String(settings.frameOpacity));
			body.setAttribute("data-taffy-panel-opacity", String(settings.panelOpacity));
			body.setAttribute("data-taffy-character-opacity", String(settings.characterOpacity));
			body.setAttribute("data-taffy-scene", "fused");
			applyOpacityVars(body, settings);
			body.toggleAttribute("data-taffy-hide-left", !settings.showLeftCharacter);
			body.toggleAttribute("data-taffy-hide-right", !settings.showRightCharacter);
			body.toggleAttribute("data-taffy-hide-mascot", !settings.showMascot);
			body.toggleAttribute("data-taffy-low-power", shouldUseLowPower(settings));
			applyQChromeVars(body, settings);
		}
		function syncStageArt(root = document.body, settings) {
			const night = isNightScene(root);
			const wallpaper = root.querySelector("[data-taffy-wallpaper]");
			const wallpaperUrl = resolveWallpaperUrl(night);
			if (wallpaper instanceof HTMLImageElement && wallpaperUrl) applyImageSrc(wallpaper, wallpaperUrl);
			const figures = resolveFigureUrls(night);
			const poses = scenePoses(night);
			const left = root.querySelector("[data-taffy-character='left']");
			const right = root.querySelector("[data-taffy-character='right']");
			const mascot = root.querySelector("[data-taffy-mascot='sidebar']");
			if (left instanceof HTMLImageElement) {
				left.dataset.taffyPose = poses.left;
				applyImageSrc(left, figures.left);
			}
			if (right instanceof HTMLImageElement) {
				right.dataset.taffyPose = poses.right;
				applyImageSrc(right, figures.right);
			}
			if (settings && mascot instanceof HTMLImageElement) applyImageSrc(mascot, resolveAvatarUrl(settings, void 0, night));
		}
		function createCharacterStage(settings) {
			if (!settings.enabled) return null;
			const night = isNightScene();
			const stage = tagChrome(document.createElement("div"), "character-stage");
			const wallpaperUrl = resolveWallpaperUrl(night);
			if (wallpaperUrl) {
				const wallpaper = document.createElement("img");
				wallpaper.dataset.skinOwner = SKIN_OWNER;
				wallpaper.dataset.taffyWallpaper = "paper";
				wallpaper.alt = "";
				wallpaper.decoding = "async";
				bindAssetFallback(wallpaper);
				applyImageSrc(wallpaper, wallpaperUrl);
				stage.append(wallpaper);
			}
			const veil = document.createElement("div");
			veil.dataset.skinOwner = SKIN_OWNER;
			veil.dataset.taffyVeil = "curtain";
			stage.append(veil);
			const sparkles = document.createElement("div");
			sparkles.dataset.skinOwner = SKIN_OWNER;
			sparkles.dataset.taffySparkles = "ambient";
			sparkles.setAttribute("aria-hidden", "true");
			const atmosphere = document.createElement("div");
			atmosphere.dataset.skinOwner = SKIN_OWNER;
			atmosphere.dataset.taffyAtmosphere = "haze";
			atmosphere.setAttribute("aria-hidden", "true");
			if (settings.portrait !== "off") {
				const figures = resolveFigureUrls(night);
				const poses = scenePoses(night);
				const leftGround = document.createElement("div");
				leftGround.dataset.skinOwner = SKIN_OWNER;
				leftGround.dataset.taffyGround = "left";
				leftGround.setAttribute("aria-hidden", "true");
				const rightGround = document.createElement("div");
				rightGround.dataset.skinOwner = SKIN_OWNER;
				rightGround.dataset.taffyGround = "right";
				rightGround.setAttribute("aria-hidden", "true");
				stage.append(leftGround, rightGround, makeImage(figures.left, "left", poses.left), makeImage(figures.right, "right", poses.right));
			}
			stage.append(atmosphere, sparkles);
			return stage;
		}
		function createAtelierFrame() {
			const frame = tagChrome(document.createElement("div"), "atelier-frame");
			const corners = document.createElement("span");
			corners.dataset.taffyFrameCorners = "";
			corners.setAttribute("aria-hidden", "true");
			for (const corner of [
				"top-left",
				"top-right",
				"bottom-left",
				"bottom-right"
			]) {
				const node = document.createElement("span");
				node.dataset.taffyFrameCorner = corner;
				node.setAttribute("aria-hidden", "true");
				corners.append(node);
			}
			const badge = document.createElement("span");
			badge.dataset.taffyFrameBadge = "";
			badge.setAttribute("aria-hidden", "true");
			frame.append(corners, badge);
			return frame;
		}
		function createStageCurtains() {
			return [tagChrome(document.createElement("div"), "taffy-top-curtain"), tagChrome(document.createElement("div"), "taffy-bottom-curtain")];
		}
		function createSidebarTrim() {
			const trim = tagChrome(document.createElement("div"), "sidebar-trim");
			for (const corner of [
				"top-left",
				"top-right",
				"bottom-right",
				"bottom-left"
			]) {
				const node = document.createElement("span");
				node.dataset.taffySidebarCorner = corner;
				node.setAttribute("aria-hidden", "true");
				trim.append(node);
			}
			for (const part of ["ribbon", "swag"]) {
				const node = document.createElement("span");
				node.dataset.taffySidebarOrnament = part;
				node.setAttribute("aria-hidden", "true");
				trim.append(node);
			}
			return trim;
		}
		function createTrims() {
			return [
				...createStageCurtains(),
				createAtelierFrame(),
				createSidebarTrim()
			];
		}
		function decorateSidebar(settings, sidebar) {
			if (sidebar.querySelector("[data-taffy-mascot='sidebar']")) return [];
			const inner = sidebar.querySelector(":scope > div");
			const host = inner instanceof HTMLElement ? inner : sidebar;
			const mascot = makeMascot(resolveAvatarUrl(settings, void 0, isNightScene()));
			host.prepend(mascot);
			return [mascot];
		}
		function removeOwnedChrome(root = document) {
			root.querySelectorAll(`[data-skin-owner="${SKIN_OWNER}"]`).forEach((node) => node.remove());
		}
		const OPACITY_VARS = [
			"--taffy-frame-opacity",
			"--taffy-panel-opacity",
			"--taffy-veil-opacity",
			"--taffy-character-opacity",
			"--taffy-acrylic-percent"
		];
		function clearOpacityVars(body) {
			for (const key of OPACITY_VARS) body.style.removeProperty(key);
		}
		function applyOpacityVars(body, settings) {
			body.style.setProperty("--taffy-frame-opacity", String(settings.frameOpacity / 100));
			body.style.setProperty("--taffy-panel-opacity", String(settings.panelOpacity));
			body.style.setProperty("--taffy-veil-opacity", String(settings.veilOpacity / 100));
			body.style.setProperty("--taffy-character-opacity", String(settings.characterOpacity / 100));
			body.style.setProperty("--taffy-acrylic-percent", String(settings.acrylicPercent));
		}
		const TAFFY_INLINE_STYLE_KEYS = [
			...Q_VARS,
			...OPACITY_VARS,
			"--taffy-conversation-left",
			"--taffy-conversation-top",
			"--taffy-conversation-width",
			"--taffy-conversation-height",
			"--taffy-conversation-content-left",
			"--taffy-conversation-content-width",
			"--taffy-conversation-viewport-top",
			"--taffy-conversation-viewport-height",
			"--taffy-content-left",
			"--taffy-content-width",
			"--taffy-viewport-top",
			"--taffy-viewport-height",
			"--taffy-frame-left",
			"--taffy-frame-top",
			"--taffy-frame-width",
			"--taffy-frame-height",
			"--taffy-right-panel-width",
			"--taffy-frame-right-inset"
		];
		//#endregion
		//#region src/client/backdrop.ts
		function applyBackdrop(body) {
			if (!body.hasAttribute("data-dsh-taffy-theme")) return;
			syncStageArt(body);
		}
		function startBackdropSync(body) {
			applyBackdrop(body);
			const observer = new MutationObserver(() => applyBackdrop(body));
			observer.observe(body, {
				attributes: true,
				attributeFilter: [
					"data-ds-dark-theme",
					"data-dsh-taffy-theme",
					"data-taffy-preset"
				]
			});
			return () => {
				observer.disconnect();
			};
		}
		//#endregion
		//#region src/client/schedule.ts
		/** Coalesce DOM work to one animation frame, optionally capped by a minimum interval. */
		function createRafScheduler(run, minIntervalMs = 0) {
			let raf = 0;
			let timeout = 0;
			let lastRun = 0;
			let intervalMs = minIntervalMs;
			const invoke = () => {
				lastRun = typeof performance !== "undefined" ? performance.now() : Date.now();
				run();
			};
			const scheduleFrame = () => {
				if (raf) return;
				raf = requestAnimationFrame(() => {
					raf = 0;
					invoke();
				});
			};
			const schedule = () => {
				if (raf || timeout) return;
				const now = typeof performance !== "undefined" ? performance.now() : Date.now();
				const elapsed = lastRun > 0 ? now - lastRun : intervalMs;
				if (intervalMs > 0 && elapsed < intervalMs) {
					timeout = window.setTimeout(() => {
						timeout = 0;
						scheduleFrame();
					}, intervalMs - elapsed);
					return;
				}
				scheduleFrame();
			};
			return {
				schedule,
				flush: () => {
					if (raf) cancelAnimationFrame(raf);
					if (timeout) clearTimeout(timeout);
					raf = 0;
					timeout = 0;
					invoke();
				},
				cancel: () => {
					if (raf) cancelAnimationFrame(raf);
					if (timeout) clearTimeout(timeout);
					raf = 0;
					timeout = 0;
				},
				setMinInterval: (ms) => {
					intervalMs = Math.max(0, ms);
				}
			};
		}
		//#endregion
		//#region src/client/projected-state.ts
		function startProjectedState(body) {
			const sync = () => {
				const conversationFlow = body.querySelector(`${ACTIVE_SELECTOR} ${CHAT_FLOW_SELECTOR}`) !== null;
				body.toggleAttribute("data-taffy-chat-active", conversationFlow);
				body.toggleAttribute("data-taffy-conversation-active", body.querySelector(ACTIVE_SELECTOR) !== null);
				body.toggleAttribute("data-taffy-workspace", body.querySelector(WORKSPACE_SELECTOR) !== null);
				body.toggleAttribute("data-taffy-better-sidebar-open", (() => {
					const panel = body.querySelector(BETTER_SIDEBAR_SELECTOR);
					if (!(panel instanceof HTMLElement)) return false;
					if (body.hasAttribute("data-dsh-sidebar-collapsed")) return false;
					const box = panel.getBoundingClientRect();
					return box.height > 80 && box.width > 160 && box.width < window.innerWidth * .72;
				})());
				body.toggleAttribute("data-taffy-settings-open", body.querySelector(SETTINGS_DIALOG_SELECTOR) !== null);
				body.toggleAttribute("data-dsh-floating-panel-open", body.querySelector("[data-dsh-floating-panel]") !== null);
			};
			sync();
			const scheduler = createRafScheduler(sync);
			const observer = new MutationObserver(() => scheduler.schedule());
			observer.observe(body, {
				attributes: true,
				attributeFilter: [
					"data-phase",
					"data-chat-flow",
					"data-dsh-better-sidebar",
					"data-dsh-sidebar-collapsed"
				],
				childList: true,
				subtree: true
			});
			return () => {
				scheduler.cancel();
				observer.disconnect();
				body.removeAttribute("data-taffy-chat-active");
				body.removeAttribute("data-taffy-conversation-active");
				body.removeAttribute("data-taffy-workspace");
				body.removeAttribute("data-taffy-better-sidebar-open");
				body.removeAttribute("data-taffy-settings-open");
				body.removeAttribute("data-dsh-floating-panel-open");
			};
		}
		//#endregion
		//#region src/client/sidebar-metrics.ts
		function measureRightPanelWidth(doc) {
			const vw = doc.defaultView?.innerWidth ?? 0;
			if (vw <= 0) return 0;
			let leftEdge = vw;
			let found = false;
			for (const node of doc.querySelectorAll(RIGHT_DOCK_SELECTOR)) {
				if (!(node instanceof HTMLElement)) continue;
				if (node.closest(`[data-skin-owner="dsh-taffy-theme"]`)) continue;
				const box = node.getBoundingClientRect();
				if (box.width < 160 || box.height < 120) continue;
				if (box.left < vw * .5) continue;
				if (box.left >= vw - 12) continue;
				leftEdge = Math.min(leftEdge, box.left);
				found = true;
			}
			return found ? Math.max(0, Math.round(vw - leftEdge)) : 0;
		}
		function startSidebarMetrics(doc) {
			const sheet = doc.createElement("style");
			sheet.dataset.skinChrome = "sidebar-width-rule";
			sheet.dataset.skinOwner = SKIN_OWNER;
			doc.head.append(sheet);
			sheet.sheet?.insertRule("body { --taffy-sidebar-width: 280px; --taffy-details-width: 0px; --taffy-right-panel-width: 0px; --taffy-sidebar-footer-height: 56px; }");
			const widthRule = sheet.sheet?.cssRules[0];
			let sidebarObserver;
			let dockObserver;
			let currentSidebar = null;
			const writeSidebar = (width) => {
				if (!widthRule) return;
				const rounded = Math.max(0, Math.round(width));
				widthRule.style.setProperty("--taffy-sidebar-width", `${rounded}px`);
				const size = rounded <= 120 ? "rail" : rounded <= 220 ? "narrow" : "wide";
				doc.body.dataset.taffySidebarSize = size;
			};
			const writeFooter = (sidebar) => {
				if (!widthRule) return;
				const slot = sidebar.querySelector("[data-slot='sidebar.settings']");
				const button = slot instanceof HTMLElement ? slot.matches("button") ? slot : slot.querySelector("button") ?? slot : sidebar.querySelector("button[aria-label='设置']");
				if (!(button instanceof HTMLElement) || button.getBoundingClientRect().height < 8) {
					widthRule.style.setProperty("--taffy-sidebar-footer-height", "56px");
					return;
				}
				let cluster = button;
				const parent = button.parentElement;
				if (parent instanceof HTMLElement && parent !== sidebar) {
					const parentBox = parent.getBoundingClientRect();
					const sidebarBox = sidebar.getBoundingClientRect();
					if (parentBox.height > 0 && parentBox.height < sidebarBox.height * .35) cluster = parent;
				}
				const rounded = Math.max(44, Math.round(sidebar.getBoundingClientRect().bottom - cluster.getBoundingClientRect().top));
				widthRule.style.setProperty("--taffy-sidebar-footer-height", `${rounded}px`);
			};
			const writeRightPanel = () => {
				if (!widthRule) return;
				const width = measureRightPanelWidth(doc);
				widthRule.style.setProperty("--taffy-details-width", `${width}px`);
				widthRule.style.setProperty("--taffy-right-panel-width", `${width}px`);
				doc.body.toggleAttribute("data-taffy-details-open", width > 40);
				doc.body.toggleAttribute("data-taffy-right-crowded", width > 380);
			};
			const attachSidebar = (sidebar) => {
				writeFooter(sidebar);
				if (currentSidebar === sidebar) return;
				sidebarObserver?.disconnect();
				currentSidebar = sidebar;
				writeSidebar(sidebar.getBoundingClientRect().width);
				writeFooter(sidebar);
				sidebarObserver = new ResizeObserver((entries) => {
					const entry = entries.at(-1);
					if (entry) writeSidebar(entry.contentRect.width);
					writeFooter(sidebar);
				});
				sidebarObserver.observe(sidebar);
			};
			const attachDocks = () => {
				dockObserver?.disconnect();
				dockObserver = new ResizeObserver(() => writeRightPanel());
				for (const node of doc.querySelectorAll(RIGHT_DOCK_SELECTOR)) if (node instanceof HTMLElement) dockObserver.observe(node);
				writeRightPanel();
			};
			const tryAttach = () => {
				const sidebar = doc.querySelector(SIDEBAR_SELECTOR);
				if (sidebar instanceof HTMLElement) attachSidebar(sidebar);
				attachDocks();
			};
			tryAttach();
			const scheduler = createRafScheduler(tryAttach, 48);
			const mutationObserver = new MutationObserver(() => scheduler.schedule());
			mutationObserver.observe(doc.body, {
				childList: true,
				subtree: true
			});
			doc.defaultView?.addEventListener("resize", writeRightPanel);
			return () => {
				scheduler.cancel();
				sidebarObserver?.disconnect();
				dockObserver?.disconnect();
				mutationObserver.disconnect();
				doc.defaultView?.removeEventListener("resize", writeRightPanel);
				sheet.remove();
				delete doc.body.dataset.taffySidebarSize;
				doc.body.removeAttribute("data-taffy-details-open");
				doc.body.removeAttribute("data-taffy-right-crowded");
			};
		}
		//#endregion
		//#region src/client/conversation-metrics.ts
		const MEASURE_INTERVAL_MS = 16;
		const STREAMING_MEASURE_INTERVAL_MS = 120;
		const STREAMING_STAMP_INTERVAL_MS = 500;
		const CONVERSATION_METRIC_KEYS = [
			"--taffy-conversation-left",
			"--taffy-conversation-top",
			"--taffy-conversation-width",
			"--taffy-conversation-height",
			"--taffy-conversation-content-left",
			"--taffy-conversation-content-width",
			"--taffy-conversation-viewport-top",
			"--taffy-conversation-viewport-height",
			"--taffy-content-left",
			"--taffy-content-width",
			"--taffy-viewport-top",
			"--taffy-viewport-height",
			"--taffy-frame-left",
			"--taffy-frame-top",
			"--taffy-frame-width",
			"--taffy-frame-height",
			"--taffy-frame-right-inset",
			"--taffy-composer-top",
			"--taffy-composer-height"
		];
		function computeFrameBox(rects) {
			const { shell, content, viewport, composer } = rects;
			const viewportLeft = typeof viewport.left === "number" ? viewport.left : content.left;
			const viewportWidth = typeof viewport.width === "number" && viewport.width > 40 ? viewport.width : content.width;
			let left = viewportLeft - 4;
			let right = viewportLeft + viewportWidth + 4;
			let top = viewport.top - 4;
			let bottom = viewport.top + viewport.height + 4;
			if (content.width > 40) {
				left = Math.min(left, content.left - 4);
				right = Math.max(right, content.left + content.width + 4);
			}
			if (composer && composer.width > 40 && composer.height > 24) {
				left = Math.min(left, composer.left - 4);
				right = Math.max(right, composer.left + composer.width + 4);
				top = Math.min(top, composer.top - 4);
				bottom = Math.max(bottom, composer.top + composer.height + 4);
			}
			const shellLeft = shell.left + 0;
			const shellTop = shell.top + 0;
			const shellRight = shell.left + shell.width - 0;
			const shellBottom = shell.top + shell.height - 0;
			left = Math.max(left, shellLeft);
			top = Math.max(top, shellTop);
			right = Math.min(right, shellRight);
			bottom = Math.min(bottom, shellBottom);
			if (right - left < 48 || bottom - top < 48) return {
				left: Math.round(shellLeft),
				top: Math.round(shellTop),
				width: Math.max(0, Math.round(shellRight - shellLeft)),
				height: Math.max(0, Math.round(shellBottom - shellTop))
			};
			return {
				left: Math.round(left),
				top: Math.round(top),
				width: Math.round(right - left),
				height: Math.round(bottom - top)
			};
		}
		const TRACKED_SELECTOR = [
			CONVERSATION_SELECTOR,
			CHAT_FLOW_SELECTOR,
			CONVERSATION_SCROLL_SELECTOR,
			COMPOSER_CARD_SELECTOR,
			COMPOSER_OVERLAY_SELECTOR,
			HERO_SELECTOR,
			SIDEBAR_SELECTOR,
			DETAILS_SELECTOR,
			"[data-phase='active']"
		].join(", ");
		function asElement(node) {
			return node instanceof HTMLElement ? node : null;
		}
		function visibleWidth(node) {
			return node ? node.getBoundingClientRect().width : 0;
		}
		function findConversationPane(doc) {
			const preferred = asElement(doc.querySelector("[data-pane='conversation']"));
			if (preferred && visibleWidth(preferred) > 0) return preferred;
			const candidates = [...doc.querySelectorAll(CONVERSATION_SELECTOR)].filter((node) => {
				return node instanceof HTMLElement;
			});
			let best = null;
			let bestWidth = 0;
			for (const node of candidates) {
				const width = node.getBoundingClientRect().width;
				if (width > bestWidth) {
					best = node;
					bestWidth = width;
				}
			}
			return best;
		}
		function findChatFlow(shell) {
			const scoped = asElement(shell.querySelector(CHAT_FLOW_SELECTOR));
			if (scoped && visibleWidth(scoped) > 0) return scoped;
			const global = asElement(shell.ownerDocument.querySelector(CHAT_FLOW_SELECTOR));
			return global && visibleWidth(global) > 0 ? global : null;
		}
		function findConversationScroll(shell) {
			const scoped = asElement(shell.querySelector(CONVERSATION_SCROLL_SELECTOR));
			if (scoped && scoped.getBoundingClientRect().height > 0) return scoped;
			return asElement(shell.ownerDocument.querySelector(CONVERSATION_SCROLL_SELECTOR));
		}
		function findContentColumn(shell) {
			const phaseRoot = asElement(shell.querySelector("[data-phase]"));
			if (shell.matches("[data-phase='hero']") || phaseRoot?.getAttribute("data-phase") === "hero") {
				const composer = asElement(shell.querySelector(COMPOSER_CARD_SELECTOR));
				if (composer && visibleWidth(composer) > 0) return composer;
			}
			return findChatFlow(shell) ?? findConversationScroll(shell) ?? shell;
		}
		function findViewportColumn(shell, content) {
			const phaseRoot = asElement(shell.querySelector("[data-phase]"));
			if (shell.matches("[data-phase='hero']") || phaseRoot?.getAttribute("data-phase") === "hero") return content;
			return findConversationScroll(shell) ?? shell;
		}
		function findComposerCard(shell) {
			const scoped = asElement(shell.querySelector(COMPOSER_CARD_SELECTOR));
			if (scoped && visibleWidth(scoped) > 0) return scoped;
			const global = asElement(shell.ownerDocument.querySelector(COMPOSER_CARD_SELECTOR));
			return global && visibleWidth(global) > 0 ? global : null;
		}
		function writeConversationMetrics(body, rects) {
			const hidden = rects.content.width < 48 || rects.viewport.height < 48;
			body.style.setProperty("--taffy-conversation-left", `${Math.round(rects.shell.left)}px`);
			body.style.setProperty("--taffy-conversation-top", `${Math.round(rects.shell.top)}px`);
			body.style.setProperty("--taffy-conversation-width", `${Math.round(rects.shell.width)}px`);
			body.style.setProperty("--taffy-conversation-height", `${Math.round(rects.shell.height)}px`);
			body.style.setProperty("--taffy-conversation-content-left", `${Math.round(rects.content.left)}px`);
			body.style.setProperty("--taffy-conversation-content-width", `${Math.round(rects.content.width)}px`);
			body.style.setProperty("--taffy-conversation-viewport-top", `${Math.round(rects.viewport.top)}px`);
			body.style.setProperty("--taffy-conversation-viewport-height", `${Math.round(rects.viewport.height)}px`);
			body.style.setProperty("--taffy-content-left", `${Math.round(rects.content.left)}px`);
			body.style.setProperty("--taffy-content-width", `${Math.round(rects.content.width)}px`);
			body.style.setProperty("--taffy-viewport-top", `${Math.round(rects.viewport.top)}px`);
			body.style.setProperty("--taffy-viewport-height", `${Math.round(rects.viewport.height)}px`);
			const frame = computeFrameBox(rects);
			body.style.setProperty("--taffy-frame-left", `${frame.left}px`);
			body.style.setProperty("--taffy-frame-top", `${frame.top}px`);
			body.style.setProperty("--taffy-frame-width", `${frame.width}px`);
			body.style.setProperty("--taffy-frame-height", `${frame.height}px`);
			const composerTop = rects.composer && rects.composer.height > 24 ? Math.round(rects.composer.top) : frame.top + frame.height;
			const composerHeight = rects.composer && rects.composer.height > 24 ? Math.round(rects.composer.height) : 0;
			body.style.setProperty("--taffy-composer-top", `${composerTop}px`);
			body.style.setProperty("--taffy-composer-height", `${composerHeight}px`);
			const vw = body.ownerDocument.defaultView?.innerWidth ?? 0;
			const fromContent = rects.content.width > 40 ? Math.max(0, Math.round(vw - (rects.content.left + rects.content.width))) : 0;
			body.style.setProperty("--taffy-frame-right-inset", `${fromContent}px`);
			body.toggleAttribute("data-taffy-frame-hidden", hidden);
			body.toggleAttribute("data-taffy-frame-compact", !hidden && rects.content.width < 420);
		}
		function touchesTracked(node) {
			if (!(node instanceof Element)) return false;
			return Element.prototype.matches.call(node, TRACKED_SELECTOR) || Element.prototype.querySelector.call(node, TRACKED_SELECTOR) !== null;
		}
		function startConversationMetrics(doc, body) {
			const original = snapshotInlineStyles(body, CONVERSATION_METRIC_KEYS);
			let shell = null;
			let content = null;
			let viewport = null;
			let composer = null;
			let sidebar = null;
			let details = null;
			let lastStampAt = 0;
			let resizeObserver;
			let mutationObserver;
			let disposed = false;
			const syncObserved = (next, current) => {
				if (next === current) return current;
				if (current) resizeObserver?.unobserve(current);
				if (next) resizeObserver?.observe(next);
				return next;
			};
			const measure = () => {
				if (disposed) return;
				const nextShell = findConversationPane(doc);
				shell = syncObserved(nextShell, shell);
				if (!shell) {
					content = syncObserved(null, content);
					viewport = syncObserved(null, viewport);
					composer = syncObserved(null, composer);
					sidebar = syncObserved(null, sidebar);
					details = syncObserved(null, details);
					body.setAttribute("data-taffy-frame-hidden", "");
					body.removeAttribute("data-taffy-frame-compact");
					for (const key of CONVERSATION_METRIC_KEYS) body.style.removeProperty(key);
					return;
				}
				const nextContent = findContentColumn(shell);
				const nextViewport = findViewportColumn(shell, nextContent);
				const nextComposer = findComposerCard(shell);
				content = syncObserved(nextContent, content);
				viewport = syncObserved(nextViewport, viewport);
				composer = syncObserved(nextComposer, composer);
				sidebar = syncObserved(asElement(doc.querySelector(SIDEBAR_SELECTOR)), sidebar);
				details = syncObserved(asElement(doc.querySelector(DETAILS_SELECTOR)), details);
				writeConversationMetrics(body, {
					shell: shell.getBoundingClientRect(),
					content: nextContent.getBoundingClientRect(),
					viewport: nextViewport.getBoundingClientRect(),
					composer: nextComposer?.getBoundingClientRect() ?? null
				});
				const streaming = doc.querySelector(STREAMING_SELECTOR) !== null;
				scheduler.setMinInterval(streaming ? STREAMING_MEASURE_INTERVAL_MS : MEASURE_INTERVAL_MS);
				const now = Date.now();
				if (!streaming || now - lastStampAt >= STREAMING_STAMP_INTERVAL_MS) {
					stampMetrics(doc, body);
					lastStampAt = now;
				}
			};
			const scheduler = createRafScheduler(measure, MEASURE_INTERVAL_MS);
			const onWindowResize = () => scheduler.schedule();
			const dispose = () => {
				if (disposed) return;
				disposed = true;
				scheduler.cancel();
				resizeObserver?.disconnect();
				mutationObserver?.disconnect();
				window.removeEventListener("resize", onWindowResize);
				window.visualViewport?.removeEventListener("resize", onWindowResize);
				restoreInlineStyles(body, original);
				body.removeAttribute("data-taffy-frame-hidden");
				body.removeAttribute("data-taffy-frame-compact");
			};
			try {
				resizeObserver = new ResizeObserver(() => scheduler.schedule());
				mutationObserver = new MutationObserver((mutations) => {
					for (const mutation of mutations) {
						if (mutation.type === "attributes") {
							scheduler.schedule();
							return;
						}
						if (mutation.type !== "childList") continue;
						for (const node of mutation.addedNodes) if (touchesTracked(node)) {
							scheduler.schedule();
							return;
						}
						for (const node of mutation.removedNodes) if (touchesTracked(node) || node === shell || node === content || node === viewport || node === composer) {
							scheduler.schedule();
							return;
						}
					}
				});
				mutationObserver.observe(doc.body, {
					childList: true,
					subtree: true,
					attributes: true,
					attributeFilter: [
						"data-phase",
						"data-chat-flow",
						"data-conversation-composer-overlay"
					]
				});
				window.addEventListener("resize", onWindowResize);
				window.visualViewport?.addEventListener("resize", onWindowResize);
				measure();
			} catch (error) {
				dispose();
				throw error;
			}
			return dispose;
		}
		//#endregion
		//#region src/client/acrylic-surfaces.ts
		const SURFACE_ATTR = "data-taffy-surface";
		const OWNER_ATTR = "data-taffy-surface-owner";
		function clearOwnedSurface(element) {
			if (element.getAttribute(OWNER_ATTR) !== "dsh-taffy-theme") return;
			element.removeAttribute(OWNER_ATTR);
			element.removeAttribute(SURFACE_ATTR);
		}
		function clearOwnedSurfaces(doc) {
			for (const node of doc.querySelectorAll(`[${OWNER_ATTR}="dsh-taffy-theme"]`)) if (node instanceof HTMLElement) clearOwnedSurface(node);
		}
		/**
		* Acrylic is CSS opt-in only. This runtime never writes surface attributes onto
		* host panes or third-party plugins. It only clears leftovers from older builds.
		*/
		function startAcrylicSurfaces(doc) {
			clearOwnedSurfaces(doc);
			return () => {
				clearOwnedSurfaces(doc);
			};
		}
		//#endregion
		//#region src/client/chrome-observer.ts
		function isSkinOwned(node) {
			return node instanceof Element && (node.getAttribute("data-skin-owner") === "dsh-taffy-theme" || node.closest(`[data-skin-owner="dsh-taffy-theme"]`) !== null);
		}
		function touchesSelector(node, selector) {
			return node instanceof Element && (node.matches(selector) || node.querySelector(selector) !== null);
		}
		function createChromeObserver(options) {
			const sidebarNodes = /* @__PURE__ */ new Map();
			const clearSidebar = (sidebar) => {
				for (const node of sidebarNodes.get(sidebar) ?? []) node.remove();
				sidebarNodes.delete(sidebar);
			};
			const maybeDecorateSidebar = () => {
				const settings = options.getSettings();
				if (!settings.enabled) return;
				const sidebar = document.querySelector(SIDEBAR_SELECTOR);
				if (!(sidebar instanceof HTMLElement)) return;
				if (sidebar.querySelector(`[data-skin-owner="dsh-taffy-theme"][data-taffy-mascot='sidebar']`)) return;
				clearSidebar(sidebar);
				const nodes = decorateSidebar(settings, sidebar);
				sidebarNodes.set(sidebar, nodes);
				options.onNodes?.(nodes);
				options.onSidebarChange?.();
			};
			const scheduler = createRafScheduler(maybeDecorateSidebar);
			const observer = new MutationObserver((mutations) => {
				let sidebarChanged = false;
				for (const mutation of mutations) if (mutation.type === "childList") for (const node of mutation.addedNodes) {
					if (isSkinOwned(node)) continue;
					if (touchesSelector(node, ":is([data-pane='sidebar'], [class*='sidebarCol'])")) sidebarChanged = true;
				}
				if (sidebarChanged) scheduler.schedule();
			});
			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
			maybeDecorateSidebar();
			return { disconnect: () => {
				scheduler.cancel();
				observer.disconnect();
				for (const sidebar of sidebarNodes.keys()) clearSidebar(sidebar);
				sidebarNodes.clear();
			} };
		}
		//#endregion
		//#region src/client/state-view.ts
		const AGENT_THROTTLE_MS = 120;
		function createStateObserver(options) {
			const body = document.body;
			let lastEmitAt = 0;
			const readSignals = () => {
				const activeConversation = body.querySelector(ACTIVE_SELECTOR) !== null;
				const composerPhase = body.querySelector("[data-chat-flow]")?.getAttribute("data-phase") ?? null;
				const streaming = body.querySelector(STREAMING_SELECTOR) !== null;
				const hasToolCall = body.querySelector(TOOL_CALL_SELECTOR) !== null;
				const now = Date.now();
				if (now - lastEmitAt < AGENT_THROTTLE_MS) return;
				lastEmitAt = now;
				mapDomSignals({
					activeConversation,
					composerPhase,
					streaming,
					hasToolCall,
					error: false,
					success: false
				}, options.onState);
			};
			readSignals();
			const scheduler = createRafScheduler(readSignals, 32);
			const observer = new MutationObserver(() => scheduler.schedule());
			observer.observe(body, {
				attributes: true,
				attributeFilter: ["data-phase", "data-streaming"],
				childList: true,
				subtree: true
			});
			return () => {
				scheduler.cancel();
				observer.disconnect();
			};
		}
		//#endregion
		//#region src/client/settings-panel.ts
		const SETTINGS_NS = "settings.taffyTheme";
		function CloverIcon() {
			return (0, react.createElement)("svg", {
				className: "dsh-taffy-clover",
				viewBox: "0 0 16 16",
				width: 16,
				height: 16,
				"aria-hidden": "true"
			}, (0, react.createElement)("path", {
				fill: "currentColor",
				d: "M8 1.6c1.4 1.6 1.6 3.4 1.2 4.6 1.2-.6 2.8-.4 4 0.8 1 1 1 2.6 0 3.6-1 1-2.5 1.1-3.6.4 0.3 1.2 0 2.9-1.6 4.4-1.6-1.5-1.9-3.2-1.6-4.4-1.1.7-2.6.6-3.6-.4-1-1-1-2.6 0-3.6 1.2-1.2 2.8-1.4 4-.8C6.4 5 6.6 3.2 8 1.6z"
			}));
		}
		function Cube({ selected, label, onClick }) {
			return (0, react.createElement)("button", {
				type: "button",
				className: `dsh-taffy-general-cube${selected ? " is-selected" : ""}`,
				"aria-pressed": selected,
				onClick
			}, selected ? CloverIcon() : null, label);
		}
		function Slider({ label, value, onChange }) {
			return (0, react.createElement)("label", { className: "dsh-taffy-slider-row" }, (0, react.createElement)("span", { className: "dsh-taffy-slider-head" }, (0, react.createElement)("span", null, label), (0, react.createElement)("output", null, `${value}%`)), (0, react.createElement)("input", {
				type: "range",
				min: 0,
				max: 100,
				step: 1,
				value,
				onInput: (event) => onChange(Number(event.currentTarget.value)),
				onChange: (event) => onChange(Number(event.currentTarget.value))
			}));
		}
		function TaffyModeRow() {
			const [settings, setSettings] = (0, react.useState)(loadSettings);
			(0, react.useEffect)(() => {
				const refresh = () => setSettings(loadSettings());
				window.addEventListener("storage", refresh);
				window.addEventListener("dsh-taffy-theme:settings-change", refresh);
				return () => {
					window.removeEventListener("storage", refresh);
					window.removeEventListener("dsh-taffy-theme:settings-change", refresh);
				};
			}, []);
			const commit = (patch) => {
				const next = {
					...settings,
					...patch
				};
				setSettings(next);
				saveSettings(next);
			};
			return (0, react.createElement)("div", {
				className: "dsh-taffy-general-row",
				"data-dsh-taffy-settings": ""
			}, (0, react.createElement)("div", { className: "dsh-taffy-general-title" }, "塔菲工房"), (0, react.createElement)("div", { className: "dsh-taffy-general-cubes" }, (0, react.createElement)(Cube, {
				selected: settings.enabled,
				label: "开启",
				onClick: () => commit({ enabled: true })
			}), (0, react.createElement)(Cube, {
				selected: !settings.enabled,
				label: "关闭",
				onClick: () => commit({ enabled: false })
			})), (0, react.createElement)(Slider, {
				label: "边框透明度",
				value: settings.frameOpacity,
				onChange: (frameOpacity) => commit({ frameOpacity })
			}), (0, react.createElement)(Slider, {
				label: "面板透明度",
				value: settings.panelOpacity,
				onChange: (panelOpacity) => commit({ panelOpacity })
			}), (0, react.createElement)(Slider, {
				label: "背景纱",
				value: settings.veilOpacity,
				onChange: (veilOpacity) => commit({ veilOpacity })
			}), (0, react.createElement)(Slider, {
				label: "亚克力透明度",
				value: settings.acrylicPercent,
				onChange: (acrylicPercent) => commit({ acrylicPercent })
			}), (0, react.createElement)("div", { className: "dsh-taffy-general-title" }, "立绘"), (0, react.createElement)("div", { className: "dsh-taffy-general-cubes" }, (0, react.createElement)(Cube, {
				selected: settings.showLeftCharacter,
				label: "左侧",
				onClick: () => commit({ showLeftCharacter: !settings.showLeftCharacter })
			}), (0, react.createElement)(Cube, {
				selected: settings.showRightCharacter,
				label: "右侧",
				onClick: () => commit({ showRightCharacter: !settings.showRightCharacter })
			}), (0, react.createElement)(Cube, {
				selected: settings.showMascot,
				label: "加油喵",
				onClick: () => commit({ showMascot: !settings.showMascot })
			})), (0, react.createElement)(Slider, {
				label: "立绘透明度",
				value: settings.characterOpacity,
				onChange: (characterOpacity) => commit({ characterOpacity })
			}), (0, react.createElement)("div", { className: "dsh-taffy-general-title" }, "减弱动效"), (0, react.createElement)("div", { className: "dsh-taffy-general-cubes" }, (0, react.createElement)(Cube, {
				selected: settings.reducedMotion,
				label: "开启",
				onClick: () => commit({
					reducedMotion: true,
					motion: "off"
				})
			}), (0, react.createElement)(Cube, {
				selected: !settings.reducedMotion,
				label: "关闭",
				onClick: () => commit({
					reducedMotion: false,
					motion: "standard"
				})
			})), (0, react.createElement)("div", { className: "dsh-taffy-general-note" }, "工房开了喵：浅色花房、深色舞台跟着「外观」走。边框包住对话，百分比只改透明层，人物默认不透明。想听塔菲说话，去 Agent 预设里选「Taffy 塔菲」喵。"));
		}
		function registerSettingsPanel(ctx) {
			ctx.effect(() => ctx.locale.register(SETTINGS_NS, {
				zh: { "settings.taffyTheme.label": "塔菲工房" },
				en: { "settings.taffyTheme.label": "Taffy atelier" }
			}), "@dsh-external/dsh-taffy-theme: locale");
			ctx.slots.inject("settings.general.item", () => ctx.slots.register({
				name: "settings.general.item",
				id: "taffy-theme",
				order: 11,
				locale: SETTINGS_NS
			}, TaffyModeRow));
		}
		//#endregion
		//#region src/client/index.ts
		const name = "@dsh-external/dsh-taffy-theme";
		const inject = ["slots", "locale"];
		function apply(ctx) {
			const body = document.body;
			const tokenSnapshot = snapshotThemeTokens(body);
			const inlineSnapshot = snapshotInlineStyles(body, TAFFY_INLINE_STYLE_KEYS);
			let settings = loadSettings();
			let state = "idle";
			let chromeMounted = false;
			let disposeStateObserver;
			let disposeTimePhase;
			let disposeSettingsSub;
			let disposeBackdrop;
			let disposeProjectedState;
			let disposeSidebarMetrics;
			let disposeConversationMetrics;
			let disposeAcrylicSurfaces;
			let disposeChromeObserver;
			const restoreHostStyles = () => {
				restoreThemeTokens(body, tokenSnapshot);
				restoreInlineStyles(body, inlineSnapshot);
			};
			const disposeChromeRuntime = () => {
				disposeBackdrop?.();
				disposeBackdrop = void 0;
				disposeProjectedState?.();
				disposeProjectedState = void 0;
				disposeSidebarMetrics?.();
				disposeSidebarMetrics = void 0;
				disposeConversationMetrics?.();
				disposeConversationMetrics = void 0;
				disposeAcrylicSurfaces?.();
				disposeAcrylicSurfaces = void 0;
				disposeChromeObserver?.();
				disposeChromeObserver = void 0;
			};
			const unmountChrome = () => {
				disposeChromeRuntime();
				removeOwnedChrome(document);
				chromeMounted = false;
			};
			const syncTheme = () => {
				ensureStyleNode(document);
				if (!settings.enabled) {
					applyRootAttributes(body, settings, state);
					restoreHostStyles();
					stampMetrics(document, body);
					return;
				}
				applyThemeTokens(body, resolveThemeTokens(settings.colors), { pinText: settings.colors.preset === "custom" && Boolean(settings.colors.text) });
				applyRootAttributes(body, settings, state);
				if (settings.timePhaseEnabled) body.setAttribute("data-time-phase", resolveTimePhase());
				else body.removeAttribute("data-time-phase");
				stampMetrics(document, body);
			};
			const mountStaticChrome = () => {
				if (chromeMounted) {
					syncStageArt(body, settings);
					if (!body.querySelector("[data-skin-chrome='taffy-top-curtain']")) for (const node of createStageCurtains()) body.append(node);
					return;
				}
				if (!settings.enabled) return;
				removeOwnedChrome(document);
				const stage = createCharacterStage(settings);
				if (stage) body.prepend(stage);
				for (const trim of createTrims()) body.append(trim);
				disposeBackdrop = startBackdropSync(body);
				disposeProjectedState = startProjectedState(body);
				disposeSidebarMetrics = startSidebarMetrics(document);
				disposeConversationMetrics = startConversationMetrics(document, body);
				disposeAcrylicSurfaces = startAcrylicSurfaces(document);
				disposeChromeObserver = createChromeObserver({ getSettings: () => settings }).disconnect;
				chromeMounted = true;
			};
			const ensureChrome = () => {
				if (!settings.enabled) {
					unmountChrome();
					return;
				}
				mountStaticChrome();
			};
			ctx.effect(() => {
				resetMetricsStampState();
				setMetricsEnabledGetter(() => settings.enabled);
				ensureStyleNode(document);
				syncTheme();
				ensureChrome();
				disposeStateObserver = createStateObserver({ onState: (next) => {
					state = next;
					if (settings.enabled) body.setAttribute("data-taffy-state", state);
				} });
				disposeTimePhase = settings.timePhaseEnabled ? startTimePhaseTicker((phase) => body.setAttribute("data-time-phase", phase)) : void 0;
				disposeSettingsSub = subscribeSettings((next) => {
					settings = next;
					syncTheme();
					ensureChrome();
				});
				return () => {
					disposeStateObserver?.();
					disposeStateObserver = void 0;
					disposeTimePhase?.();
					disposeSettingsSub?.();
					unmountChrome();
					resetStateAdapter();
					removeStyleNode(document);
					clearMetricsStamp(document);
					body.removeAttribute("data-dsh-taffy-theme");
					body.removeAttribute("data-taffy-state");
					body.removeAttribute("data-taffy-preset");
					body.removeAttribute("data-taffy-chat-active");
					body.removeAttribute("data-taffy-conversation-active");
					body.removeAttribute("data-taffy-workspace");
					body.removeAttribute("data-taffy-better-sidebar-open");
					body.removeAttribute("data-taffy-details-open");
					body.removeAttribute("data-taffy-settings-open");
					body.removeAttribute("data-dsh-floating-panel-open");
					body.removeAttribute("data-time-phase");
					body.removeAttribute("data-dsh-taffy-intensity");
					body.removeAttribute("data-dsh-taffy-motion");
					body.removeAttribute("data-dsh-taffy-reduced-motion");
					body.removeAttribute("data-taffy-veil");
					body.removeAttribute("data-taffy-low-power");
					body.removeAttribute("data-taffy-acrylic-percent");
					body.removeAttribute("data-taffy-frame-opacity");
					body.removeAttribute("data-taffy-panel-opacity");
					body.removeAttribute("data-taffy-character-opacity");
					body.removeAttribute("data-taffy-scene");
					body.removeAttribute("data-taffy-hide-left");
					body.removeAttribute("data-taffy-hide-right");
					body.removeAttribute("data-taffy-hide-mascot");
					body.removeAttribute("data-taffy-right-crowded");
					body.removeAttribute("data-taffy-q-ready");
					delete body.dataset.taffySidebarSize;
					restoreHostStyles();
				};
			}, "dsh-taffy-theme:lifecycle");
			registerSettingsPanel(ctx);
			if (!localStorage.getItem("dsh-taffy-theme:v1")) saveSettings(settings);
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map