import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="text-center">
        <p className="font-display text-7xl font-semibold text-primary">404</p>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">Sivua ei löytynyt</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Etsimääsi sivua ei ole – mutta oikea osaaja löytyy kyllä.
        </p>
        <Button className="mt-6 rounded-xl shadow-cta" asChild>
          <Link to="/selaa">
            <Compass className="size-4" /> Selaa palveluita
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
