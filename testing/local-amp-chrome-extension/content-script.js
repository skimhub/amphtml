// `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --allow-running-insecure-content --profile-directory="Default" --disable-web-security --user-data-dir`
// Does not seem to work.
function overwriteIframe() {
    const iframe = document.querySelector("iframe")
}

function injectSkimlinksInDocument(doc) {
    if(!doc) {
        return
    }
    var skimlinksScript = doc.createElement("script");
    skimlinksScript.type = "text/javascript";
    skimlinksScript.src = "http://localhost:8000/dist/v0/amp-skimlinks-0.1.max.js";
    skimlinksScript.setAttribute("custom-element", "amp-skimlinks");
    doc.head.appendChild(skimlinksScript);

    var skimlinksElement = doc.createElement("amp-skimlinks");
    skimlinksElement.setAttribute("publisher-code", "68019X1584676");
    doc.body.appendChild(skimlinksElement);

}


injectSkimlinksInDocument(document);