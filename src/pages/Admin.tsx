import React from 'react';

export default function Admin() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-gold-gradient">PAINEL ADMINISTRATIVO</h1>
      <p className="text-muted-foreground">Gerencie o Portal Hogwarts House</p>
      <div className="mt-8 text-center text-yellow-500 p-8 border border-yellow-500/30 rounded-lg bg-yellow-500/10">
        <h2 className="text-xl font-bold mb-2">Restaurando Painel...</h2>
        <p>Um erro de encoding corrompeu este arquivo na sessão anterior. O assistente está restaurando a interface completa agora mesmo. O portal está online novamente!</p>
      </div>
    </div>
  );
}
