import Cocoa
import WebKit

let args = CommandLine.arguments
let url = URL(string: args[1])!
let out = args[2]
let w = Double(args[3])!, h = Double(args[4])!
let scrollY = Double(args[5])!
let delay = Double(args[6])!

let app = NSApplication.shared
let cfg = WKWebViewConfiguration()
// bez trwałego cache — inaczej WKWebView potrafi wziąć stary style.css,
// mimo świeżego adresu strony
cfg.websiteDataStore = .nonPersistent()
let web = WKWebView(frame: NSRect(x: 0, y: 0, width: w, height: h), configuration: cfg)
let win = NSWindow(contentRect: NSRect(x: 0, y: 0, width: w, height: h),
                   styleMask: [.borderless], backing: .buffered, defer: false)
win.contentView = web
win.orderFrontRegardless()

class D: NSObject, WKNavigationDelegate {
    var done = false
    func webView(_ w: WKWebView, didFinish n: WKNavigation!) { done = true }
}
let d = D()
web.navigationDelegate = d
web.load(URLRequest(url: url))

let deadline = Date().addingTimeInterval(20)
while !d.done && Date() < deadline { RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05)) }

// pozwól wejść animacjom i wideo
var t = Date().addingTimeInterval(delay)
while Date() < t { RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05)) }

let extra = args.count > 7 ? args[7] : ""
let js = "document.documentElement.style.scrollBehavior='auto';document.querySelectorAll('.reveal').forEach(e=>{e.style.transition='none';e.style.transitionDelay='0s';e.classList.add('widac')});" + extra + ";window.scrollTo(0,\(scrollY));'ok'"
web.evaluateJavaScript(js, completionHandler: nil)
t = Date().addingTimeInterval(3.0)
while Date() < t { RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05)) }

// opcjonalne sprawdzenie: 9. argument to wyrażenie JS, którego wynik drukuję
if args.count > 8 {
    var gotowe = false
    web.evaluateJavaScript(args[8]) { wynik, blad in
        if let w = wynik { print("SPRAWDZENIE: \(w)") }
        if let b = blad { print("SPRAWDZENIE-BLAD: \(b)") }
        gotowe = true
    }
    let limit = Date().addingTimeInterval(6)
    while !gotowe && Date() < limit { RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05)) }
}

var finished = false
let sc = WKSnapshotConfiguration()
sc.afterScreenUpdates = true
web.takeSnapshot(with: sc) { img, err in
    if let img = img, let tiff = img.tiffRepresentation,
       let rep = NSBitmapImageRep(data: tiff),
       let png = rep.representation(using: .png, properties: [:]) {
        try? png.write(to: URL(fileURLWithPath: out))
        print("zapisano \(out)")
    } else { print("blad: \(String(describing: err))") }
    finished = true
}
while !finished { RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05)) }
