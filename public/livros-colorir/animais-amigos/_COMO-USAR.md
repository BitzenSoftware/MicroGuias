# Animais Amigos — imagens do livro

Salve as imagens geradas **nesta pasta**, com estes nomes exatos (`.png` ou `.jpg`):

| Arquivo            | Desenho              |
|--------------------|----------------------|
| `capa.png`         | Capa colorida        |
| `01-gato.png`      | Gatinho              |
| `02-cachorro.png`  | Cachorrinho          |
| `03-coelho.png`    | Coelho com cenoura   |
| `04-leao.png`      | Leãozinho            |
| `05-elefante.png`  | Elefantinho          |
| `06-peixe.png`     | Peixinho             |
| `07-tartaruga.png` | Tartaruga            |
| `08-passarinho.png`| Passarinho no galho  |
| `09-abelha.png`    | Abelhinha com flor   |
| `10-borboleta.png` | Borboleta            |
| `11-pinguim.png`   | Pinguim              |
| `12-girafa.png`    | Girafa               |
| `13-sapo.png`      | Sapinho              |

Depois, na raiz do projeto, rode:

```bash
node scripts/gerar_pdf_colorir.mjs
```

O PDF final será gerado aqui como **`Animais-Amigos.pdf`** (capa + 13 páginas A4, 1 desenho por folha).
O script ignora, com aviso, qualquer arquivo que estiver faltando — então dá pra testar aos poucos.
