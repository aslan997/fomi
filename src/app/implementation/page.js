import { StudioApp } from "@/components/implementation/StudioApp";

// Applies the saved theme before first paint to avoid a light→dark flash.
const themeScript = `try{if(localStorage.getItem("fomi.studio.theme")==="dark")document.documentElement.dataset.studioTheme="dark"}catch(e){}`;

export default function ImplementationPage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <StudioApp />
    </>
  );
}
