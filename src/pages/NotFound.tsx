
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { PageTransition } from '@/components/PageTransition';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: Tentativa de acesso a rota inexistente:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <span className="text-4xl font-display font-semibold text-primary">404</span>
        </div>
        <h1 className="text-3xl font-display font-semibold mb-2">Página não encontrada</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Desculpe, a página que você está procurando não existe ou foi movida.
        </p>
        <Button asChild>
          <Link to="/" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Dashboard
          </Link>
        </Button>
      </div>
    </PageTransition>
  );
};

export default NotFound;
