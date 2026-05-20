#pragma once

#include <string>

namespace lemon {
namespace utils {

/// Process-wide network settings shared by HttpClient (libcurl proxy) and
/// ProcessManager (subprocess env vars). Held here rather than on
/// RuntimeConfig so that the CLI binary, which links http_client.cpp /
/// process_manager.cpp but not runtime_config.cpp, can also build. The
/// server's config loader pushes values in on startup and on /internal/set;
/// the CLI never sets anything, so its accessors return empty strings and
/// no proxy is applied to localhost requests.
class NetworkSettings {
public:
    /// Empty string means "no proxy" / "no override".
    static std::string proxy();
    static std::string huggingface_endpoint();

    /// Convenience wrapper: returns huggingface_endpoint() when set,
    /// otherwise "https://huggingface.co". Never has a trailing slash.
    static std::string huggingface_base_url();

    static void set_proxy(const std::string& url);
    static void set_huggingface_endpoint(const std::string& url);
};

} // namespace utils
} // namespace lemon
