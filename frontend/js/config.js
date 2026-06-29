
/*

// Centralized API base URL for production
// Update this value if backend URL changes
window.API_BASE_URL = "https://vams-vnbr.onrender.com";
// Backwards-compatible global used by existing code
window.BASE_URL = window.API_BASE_URL;

// ---- Global fetch wrapper for verbose production debugging ----
// This intercepts all fetch calls (including inline scripts) and logs:
// - full request URL
// - HTTP method
// - sanitized request body
// - response status and body
// - timing information
;(function installFetchWrapper() {
	if (!window || !window.fetch) return;
	const originalFetch = window.fetch.bind(window);

	function sanitizeBodyForLog(body) {
		try {
			if (!body) return null;
			// If it's FormData, list keys and file names
			if (body instanceof FormData) {
				const entries = [];
				for (const pair of body.entries()) {
					const [k, v] = pair;
					if (v instanceof File) entries.push({ [k]: v.name });
					else entries.push({ [k]: v });
				}
				return entries;
			}
			// If it's a string (JSON), try parse
			if (typeof body === "string") {
				try {
					const parsed = JSON.parse(body);
					if (parsed && typeof parsed === "object") {
						if (parsed.password) parsed.password = "<REDACTED>";
						return parsed;
					}
				} catch { return body; }
			}
			// If object-like
			if (typeof body === "object") {
				const copy = Array.isArray(body) ? [...body] : { ...body };
				if (copy && copy.password) copy.password = "<REDACTED>";
				return copy;
			}
			return body;
		} catch (e) { return "<unserializable>"; }
	}

	window.fetch = async function fetchWithLogging(input, init = {}) {
		const start = Date.now();
		// Resolve URL (handle Request objects)
		let url = typeof input === "string" ? input : (input && input.url) || "";

		// If URL is relative, prefix with BASE_URL if available
		try {
			if (url && url.startsWith("/")) {
				url = (window.API_BASE_URL || window.BASE_URL || "") + url;
			}
		} catch (e) {}

		const method = (init && init.method) || (typeof input === "object" && input.method) || "GET";

		// Capture request body for logging (don't consume FormData)
		let loggedBody = null;
		try {
			if (init && init.body) {
				loggedBody = sanitizeBodyForLog(init.body);
			} else if (typeof input === "object" && input && !input.bodyUsed && input.body) {
				// Can't reliably read Request body here without consuming it; attempt best-effort
				loggedBody = "<request-body-unavailable>";
			}
		} catch (e) { loggedBody = "<error-inspecting-body>"; }

		console.groupCollapsed("➡️ API REQUEST", `${method} ${url}`);
		console.log("Request URL:", url);
		console.log("Method:", method);
		console.log("Sanitized body:", loggedBody);
		console.log("Start time:", new Date(start).toISOString());

		let response;
		try {
			response = await originalFetch(input, init);
		} catch (err) {
			const duration = Date.now() - start;
			console.error("⬅️ API ERROR (network):", { url, method, error: err, durationMs: duration });
			console.groupEnd();
			throw err;
		}

		const duration = Date.now() - start;

		// Clone response to read body without affecting caller
		let responseText = null;
		try {
			const cloned = response.clone();
			responseText = await cloned.text();
			try { responseText = JSON.parse(responseText); } catch
		} catch (e) {
			responseText = "<could not read response body>";
		}

		console.log("Response status:", response.status);
		console.log("Response body:", responseText);
		console.log("Duration (ms):", duration);

		if (response.status === 404) {
			console.error("❌ API ROUTE NOT FOUND", { url });
		}

		console.groupEnd();
		return response;
	};

	// Expose original fetch if needed
	window.__originalFetch = originalFetch;
})();

export default window.API_BASE_URL;



*/


window.API_BASE_URL = "https://vams-vnbr.onrender.com";