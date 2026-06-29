import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-5" data-testid="404-page">
    <p className="overline mb-3">Lost in the forest?</p>
    <h1 className="font-serif text-7xl md:text-8xl text-hk-green mb-3">404</h1>
    <p className="font-serif text-2xl mb-6">This path doesn't lead anywhere.</p>
    <Link to="/" className="hk-btn-primary">Return Home</Link>
  </div>
);
export default NotFound;
