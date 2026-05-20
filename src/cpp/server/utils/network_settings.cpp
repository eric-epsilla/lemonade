#include <lemon/utils/network_settings.h>

#include <mutex>
#include <shared_mutex>

namespace lemon {
namespace utils {

namespace {
std::shared_mutex g_mutex;
std::string g_proxy;
std::string g_hf_endpoint;
}

std::string NetworkSettings::proxy() {
    std::shared_lock lock(g_mutex);
    return g_proxy;
}

std::string NetworkSettings::huggingface_endpoint() {
    std::shared_lock lock(g_mutex);
    return g_hf_endpoint;
}

std::string NetworkSettings::huggingface_base_url() {
    static const std::string kDefault = "https://huggingface.co";
    std::string endpoint = huggingface_endpoint();
    return endpoint.empty() ? kDefault : endpoint;
}

void NetworkSettings::set_proxy(const std::string& url) {
    std::unique_lock lock(g_mutex);
    g_proxy = url;
}

void NetworkSettings::set_huggingface_endpoint(const std::string& url) {
    std::string trimmed = url;
    while (!trimmed.empty() && trimmed.back() == '/') {
        trimmed.pop_back();
    }
    std::unique_lock lock(g_mutex);
    g_hf_endpoint = std::move(trimmed);
}

} // namespace utils
} // namespace lemon
