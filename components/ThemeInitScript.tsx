const script = `(function(){try{var t=localStorage.getItem("lmf-theme-v2");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);var l=localStorage.getItem("lmf-locale");if(l==="en"||l==="sr")document.documentElement.setAttribute("data-locale",l);}catch(e){}})();`;

export default function ThemeInitScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
