// src/screens/NovaVenda.js
import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, Modal, StyleSheet, Alert, ScrollView,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from '../api/SupabaseClient';

const LOGO_PATH = 'file:///mnt/data/458fb76c-5cd7-44a7-bf1e-c9aecec33771.png';

export default function NovaVenda() {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [clientQuery, setClientQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  const [productModalVisible, setProductModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');

  // carrinho com vários itens
  const [cart, setCart] = useState([]);

  // histórico local (apenas UI)
  const [salesHistory, setSalesHistory] = useState([]);

  // Carrega clientes e produtos do Supabase
  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // carregar clientes
      const { data: clientData, error: clientErr } = await supabase
        .from('clientes')
        .select('*');

      if (clientErr) {
        console.error(clientErr);
        Alert.alert('Erro ao carregar clientes');
      } else {
        setClients(clientData || []);
      }

      // carregar produtos
      const { data: productData, error: productErr } = await supabase
        .from('produtos')
        .select('*');

      if (productErr) {
        console.error(productErr);
        Alert.alert('Erro ao carregar produtos');
      } else {
        // garante que preco seja número
        setProducts((productData || []).map(p => ({ ...p, preco: Number(p.preco) })));
      }

      setLoading(false);
    }

    loadData();
  }, []);

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c => (c.nome || '').toLowerCase().includes(q) || (c.cpf || '').includes(q));
  }, [clientQuery, clients]);

  function selectClient(client) {
    setSelectedClient(client);
    setClientQuery(client.nome);
  }

  function openProductModal() {
    setProductModalVisible(true);
  }

  function selectProductFromModal(product) {
    setSelectedProduct(product);
    setProductModalVisible(false);
  }

  function addToCart() {
    if (!selectedProduct) return Alert.alert('Selecione um produto');
    const q = parseInt(quantity, 10);
    if (!q || q <= 0) return Alert.alert('Quantidade inválida');

    // Se produto já existe no carrinho, apenas soma quantidade
    setCart(prev => {
      const exists = prev.find(i => i.product.id === selectedProduct.id);
      if (exists) {
        return prev.map(i => {
          if (i.product.id === selectedProduct.id) {
            const newQty = i.quantity + q;
            return { ...i, quantity: newQty, total: +(newQty * i.unit).toFixed(2) };
          }
          return i;
        });
      }
      return [
        ...prev,
        {
          id: `${Date.now()}-${selectedProduct.id}`,
          product: selectedProduct,
          quantity: q,
          unit: selectedProduct.preco,
          total: +(selectedProduct.preco * q).toFixed(2),
        }
      ];
    });

    // limpa seleção
    setSelectedProduct(null);
    setQuantity('1');
  }

  function removeCartItem(itemId) {
    setCart(prev => prev.filter(i => i.id !== itemId));
  }

  function updateCartQuantity(itemId, newQtyStr) {
    const newQty = parseInt(newQtyStr || '0', 10) || 0;
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQty, total: +(newQty * i.unit).toFixed(2) } : i));
  }

  const subtotal = cart.reduce((acc, i) => acc + (i.total || 0), 0);
  const total = subtotal; // aqui você pode aplicar descontos, frete etc.

  // registra a venda e itens no Supabase
  async function registrarVenda() {
    if (!selectedClient) return Alert.alert('Selecione um cliente antes de finalizar');
    if (cart.length === 0) return Alert.alert('Adicione produtos ao carrinho');

    try {
      // prepara dados da venda
      const vendaPayload = {
        cliente_id: selectedClient.id,
        vendedor: 'Raimundo', // coloque dinamicamente se quiser
        forma_pagamento: 'PIX', // trocar se precisar
        subtotal,
        total,
      };

      // inserir venda e retornar registro (inclui numero / id)
      const { data: vendaData, error: vendaErr } = await supabase
        .from('vendas')
        .insert(vendaPayload)
        .select()
        .single();

      if (vendaErr || !vendaData) {
        console.error(vendaErr);
        return Alert.alert('Erro ao registrar venda');
      }

      // preparar itens para inserir
      const itensPayload = cart.map(i => ({
        venda_id: vendaData.id,
        produto_id: i.product.id,
        quantidade: i.quantity,
        valor_unit: i.unit,
        total: i.total,
      }));

      const { error: itensErr } = await supabase
        .from('venda_itens')
        .insert(itensPayload);

      if (itensErr) {
        console.error(itensErr);
        return Alert.alert('Erro ao registrar itens da venda');
      }

      // buscar venda completa para gerar recibo
      const { data: vendaFull, error: vendaFullErr } = await supabase
        .from('vendas')
        .select(`
          *,
          clientes:cliente_id ( id, nome, cpf, endereco, telefone ),
          venda_itens ( id, quantidade, valor_unit, total, produtos:produto_id ( id, nome ) )
        `)
        .eq('id', vendaData.id)
        .single();

      // fallback se query falhar
      let vendaForPdf = null;

      if (vendaFull && !vendaFullErr) {
        vendaForPdf = {
          id: vendaFull.id,
          numero: vendaFull.numero || '',
          data: vendaFull.data || vendaFull.created_at || new Date().toISOString(),
          vendedor: vendaFull.vendedor,
          forma_pagamento: vendaFull.forma_pagamento,
          subtotal: Number(vendaFull.subtotal || subtotal),
          total: Number(vendaFull.total || total),
          cliente: vendaFull.clientes || selectedClient,
          itens: (vendaFull.venda_itens || []).map(it => ({
            nome: it.produtos ? it.produtos.nome : (products.find(p => p.id === it.produto_id)?.nome || ''),
            quantidade: it.quantidade,
            valor_unit: Number(it.valor_unit),
            total: Number(it.total),
          })),
        };
      } else {
        vendaForPdf = {
          id: vendaData.id,
          numero: vendaData.numero || '',
          data: vendaData.data || vendaData.created_at || new Date().toISOString(),
          vendedor: vendaData.vendedor,
          forma_pagamento: vendaData.forma_pagamento,
          subtotal,
          total,
          cliente: selectedClient,
          itens: cart.map(i => ({
            nome: i.product.nome,
            quantidade: i.quantity,
            valor_unit: i.unit,
            total: i.total,
          })),
        };
      }

      // adicionar ao histórico local
      setSalesHistory(prev => [{ ...vendaForPdf }, ...prev]);

      // gerar recibo PDF e compartilhar
      await generateReciboPdf(vendaForPdf);

      // limpar UI
      setCart([]);
      setSelectedClient(null);
      setClientQuery('');
      Alert.alert('Venda registrada com sucesso!');
    } catch (err) {
      console.error(err);
      Alert.alert('Erro inesperado ao registrar venda');
    }
  }

  function gerarChaveAcesso() {
    let chave = "2623";
    for (let i = 0; i < 40; i++) {
      chave += Math.floor(Math.random() * 10).toString();
    }
    return chave.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  async function generateReciboPdf(venda) {
    const chaveAcesso = gerarChaveAcesso();
    const dataEmissao = new Date(venda.data);
    const dataStr = dataEmissao.toLocaleDateString('pt-BR') + ' ' + dataEmissao.toLocaleTimeString('pt-BR');
    
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${chaveAcesso.replace(/\s/g,'')}`;

    const itensHtml = venda.itens.map((i, index) => `
      <div style="margin-bottom: 5px;">
        <div style="font-weight:bold;">${index + 1}. ${escapeHtml(i.nome.toUpperCase())}</div>
        <div style="display:flex; justify-content:space-between;">
          <span>${i.quantidade} UN x ${Number(i.valor_unit).toFixed(2).replace('.', ',')}</span>
          <span>R$ ${Number(i.total).toFixed(2).replace('.', ',')}</span>
        </div>
      </div>
    `).join('');

    const html = `
      <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 10px; 
            background: #fff; 
            margin: 0; 
            padding: 10px;
            color: #000;
          }
          .container { max-width: 300px; margin: 0 auto; }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .dashed { border-top: 1px dashed #000; margin: 5px 0; }
          .section { margin-bottom: 8px; }
          .header-info { font-size: 11px; }
          .title { font-size: 12px; font-weight: bold; margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="center section header-info">
            <div class="bold" style="font-size:14px;">SELARIA RAIMUNDO</div>
            <div>CNPJ: 60.288.584/0001-74</div>
            <div>Rua das Selarias, SN - Centro</div>
            <div>Cachoeirinha - PE</div>
            <div>Tel: (81) 99306-0970</div>
          </div>
          <div class="dashed"></div>
          <div class="center section">
            <div class="title">DANFE NFC-e - Documento Auxiliar</div>
            <div style="font-size:9px;">da Nota Fiscal de Consumidor Eletrônica</div>
            <div style="font-size:9px;">Não permite aproveitamento de crédito de ICMS</div>
          </div>
          <div class="dashed"></div>
          <div class="section">
            <div style="margin-bottom:4px; font-weight:bold;">ITEM CÓDIGO DESCRIÇÃO</div>
            <div style="margin-bottom:4px; font-weight:bold; display:flex; justify-content:space-between;">
              <span>QTD. UN. VL.UNIT</span>
              <span>VL.TOTAL</span>
            </div>
            ${itensHtml}
          </div>
          <div class="dashed"></div>
          <div class="section">
            <div style="display:flex; justify-content:space-between; font-weight:bold;">
              <span>QTD. TOTAL DE ITENS</span>
              <span>${venda.itens.reduce((acc, i) => acc + i.quantidade, 0)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:14px; margin-top:5px;">
              <span>VALOR TOTAL R$</span>
              <span>${Number(venda.total).toFixed(2).replace('.', ',')}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:5px;">
              <span>FORMA DE PAGAMENTO</span>
              <span>VALOR PAGO</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>${escapeHtml(venda.forma_pagamento)}</span>
              <span>${Number(venda.total).toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
          <div class="dashed"></div>
          <div class="center section">
            <div class="bold">EMISSÃO NORMAL</div>
            <div>Número: ${venda.numero || '000000237'} Série: 001</div>
            <div>Emissão: ${dataStr}</div>
            <div style="margin-top:5px;">Consulte pela Chave de Acesso em:</div>
            <div>http://nfce.sefaz.pe.gov.br/</div>
            <div class="bold" style="font-size:9px; margin-top:3px;">CHAVE DE ACESSO</div>
            <div style="font-size:9px; letter-spacing: 0.5px;">${chaveAcesso}</div>
          </div>
          <div class="dashed"></div>
          <div class="center section">
            <div class="bold">CONSUMIDOR</div>
            ${venda.cliente 
              ? `<div>CPF: ${venda.cliente.cpf || ''}</div>
                 <div>${escapeHtml(venda.cliente.nome)}</div>
                 <div style="font-size:9px;">${escapeHtml(venda.cliente.endereco || '')}</div>` 
              : '<div>CONSUMIDOR NÃO IDENTIFICADO</div>'
            }
          </div>
          <div class="dashed"></div>
          <div class="center section">
            <div style="font-size:9px; margin-bottom:5px;">Consulta via Leitor de QR Code</div>
            <img src="${qrCodeUrl}" style="width:120px; height:120px;" />
            <div style="font-size:9px; margin-top:5px;">Protocolo de Autorização: 3231${Math.floor(Math.random()*100000)}</div>
          </div>
          <div class="dashed"></div>
          <div class="center section" style="font-size:9px;">
            Tributos Totais Incidentes (Lei Federal 12.741/2012): R$ ${(venda.total * 0.18).toFixed(2).replace('.', ',')}
          </div>
          <div class="center bold" style="margin-top:10px; font-size:11px;">
            AGRADECEMOS A PREFERÊNCIA!
          </div>
        </div>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'NFC-e' });
    return uri;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <Text>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Nova Venda</Text>

      <Text style={styles.label}>Pesquisar cliente</Text>
      <TextInput
        placeholder="Digite nome ou CPF"
        value={clientQuery}
        onChangeText={setClientQuery}
        style={styles.input}
      />

      {/* SOLUÇÃO 1: Substituímos FlatList por um ScrollView interno com nestedScrollEnabled.
         Usamos slice(0,50) para garantir performance se houver muitos clientes.
      */}
      <View style={{ maxHeight: 140, borderWidth:1, borderColor:'#f0f0f0', borderRadius:6, marginTop:4 }}>
        <ScrollView nestedScrollEnabled={true}>
          {filteredClients.slice(0, 50).map((item) => (
             <TouchableOpacity 
                key={item.id} 
                onPress={() => selectClient(item)} 
                style={styles.listItem}
             >
              <Text>{item.nome}</Text>
              <Text style={styles.small}>{item.cpf}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.label}>Cliente selecionado</Text>
      <Text style={styles.selectedText}>
        {selectedClient ? `${selectedClient.nome} - ${selectedClient.cpf || ''}` : 'Nenhum cliente'}
      </Text>

      <Text style={styles.label}>Produto</Text>
      <TouchableOpacity style={styles.button} onPress={openProductModal}>
        <Text>{selectedProduct ? `${selectedProduct.nome} - R$ ${selectedProduct.preco.toFixed(2)}` : 'Selecionar produto'}</Text>
      </TouchableOpacity>

      {selectedProduct && (
        <>
          <Text style={styles.label}>Quantidade</Text>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={{ flexDirection:'row', gap:8 }}>
            <TouchableOpacity style={[styles.button, { flex:1 }]} onPress={addToCart}>
              <Text>Adicionar ao carrinho</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, { flex:1 }]} onPress={() => { setSelectedProduct(null); setQuantity('1'); }}>
              <Text>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text style={[styles.title, { marginTop: 16 }]}>Carrinho</Text>
      {cart.length === 0 && <Text style={{ color:'#666' }}>Carrinho vazio</Text>}

      {/* SOLUÇÃO 2: Substituímos FlatList do carrinho por .map() */}
      <View>
        {cart.map((item) => (
          <View key={item.id} style={styles.cartItem}>
            <View style={{ flex:1 }}>
              <Text style={{ fontWeight:'600' }}>{item.product.nome}</Text>
              <Text style={styles.small}>R$ {item.unit.toFixed(2)}</Text>
            </View>

            <View style={{ width:130, alignItems:'flex-end' }}>
              <Text>Qtd:</Text>
              <TextInput
                value={String(item.quantity)}
                onChangeText={(t) => updateCartQuantity(item.id, t)}
                keyboardType="numeric"
                style={[styles.input, { width:100, marginTop:6 }]}
              />
              <Text style={{ marginTop:6 }}>Total: R$ {item.total.toFixed(2)}</Text>

              <TouchableOpacity style={[styles.button, { marginTop:8 }]} onPress={() => removeCartItem(item.id)}>
                <Text>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={{ marginTop:12, alignItems:'flex-end' }}>
        <Text style={{ fontWeight:'600' }}>SUBTOTAL: R$ {subtotal.toFixed(2)}</Text>
        <Text style={{ fontSize:18, fontWeight:'700' }}>TOTAL: R$ {total.toFixed(2)}</Text>
      </View>

      <TouchableOpacity style={[styles.button, { marginTop: 14 }]} onPress={registrarVenda}>
        <Text>Registrar venda e gerar recibo</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { marginTop: 20 }]}>Histórico (local)</Text>
      
      {/* SOLUÇÃO 3: Substituímos FlatList do histórico por .map() */}
      <View>
        {salesHistory.map((item) => (
          <View key={item.id} style={styles.saleItem}>
            <Text style={{ fontWeight:'600' }}>{item.cliente?.nome || 'Cliente'} — R$ {Number(item.total).toFixed(2)}</Text>
            <Text style={styles.small}>{new Date(item.data).toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Modal de produtos - Mantido com FlatList pois está isolado do ScrollView principal */}
      <Modal visible={productModalVisible} animationType="slide">
        <View style={{ flex:1, padding:16 }}>
          <Text style={styles.title}>Escolher produto</Text>

          <FlatList
            data={products}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => selectProductFromModal(item)} style={styles.listItem}>
                <Text>{item.nome}</Text>
                <Text style={styles.small}>R$ {item.preco.toFixed(2)}</Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity onPress={() => setProductModalVisible(false)} style={[styles.button, { marginTop:12 }]}>
            <Text>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:'#fff' },
  title: { fontSize:20, fontWeight:'700', marginBottom:8 },
  label: { marginTop:12, fontWeight:'600' },
  input: {
    borderWidth:1, borderColor:'#ddd', padding:8, borderRadius:6, marginTop:6
  },
  listItem: { padding:10, borderBottomWidth:1, borderBottomColor:'#eee' },
  small: { fontSize:12, color:'#555' },
  selectedText: { marginTop:6 },
  button: {
    padding:12, borderWidth:1, borderColor:'#ccc', borderRadius:8,
    alignItems:'center', justifyContent:'center', marginTop:8
  },
  cartItem: { padding:10, borderBottomWidth:1, borderBottomColor:'#f0f0f0', flexDirection:'row' },
  saleItem: { padding:10, borderBottomWidth:1, borderBottomColor:'#f0f0f0' },
});