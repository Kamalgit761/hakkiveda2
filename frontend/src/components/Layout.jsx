import Header from "./Header";
import Footer from "./Footer";
import FloatingButtons from "./FloatingButtons";

const Layout = ({ children }) => {
  return (
    <>
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <FloatingButtons />
    </>
  );
};

export default Layout;
