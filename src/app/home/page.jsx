"use client";

import styles from "./Home.module.css";
import { useEffect, useRef, useState } from "react";

const PUBLIC_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function fetchJsonWithFallback(path, options) {
    const tryFetch = async (u) => {
        const res = await fetch(u, { headers: { Accept: "application/json" }, ...options });
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            const err = new Error(`Erro ${res.status}`);
            err.status = res.status;
            err.body = text;
            throw err;
        }
        return res.json();
    };

    // 1) via rewrite (/api/*)
    try {
        return await tryFetch(path);
    } catch (e) {
        // 2) fallback direto na BASE pública, se existir
        if (PUBLIC_BASE && typeof path === "string" && path.startsWith("/")) {
            return await tryFetch(`${PUBLIC_BASE}${path}`);
        }
        throw e;
    }
}

const parseList = (data, keys = []) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
        for (const k of ["data", "items", ...keys]) {
            if (Array.isArray(data[k])) return data[k];
        }
    }
    return [];
};

export default function Home() {
    const [marcas, setMarcas] = useState([]);
    const [veiculos, setVeiculos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const cacheRef = useRef(new Map());

    const cacheGet = (key) => cacheRef.current.get(key);
    const cacheSet = (key, value) => {
        const cache = cacheRef.current;
        if (cache.size >= 10) cache.delete(cache.keys().next().value);
        cache.set(key, value);
    };

    const loadData = async () => {
        setLoading(true);
        setError(null);
        const marcasKey = `marcas`;
        const veiculosKey = `veiculos`;
        try {
            let m = cacheGet(marcasKey);
            if (!m) {
                const raw = await fetchJsonWithFallback(`/api/marcas`);
                m = parseList(raw, ["marcas"]);
                cacheSet(marcasKey, m);
            }
            setMarcas(m);

            let v = cacheGet(veiculosKey);
            if (!v) {
                const raw = await fetchJsonWithFallback(`/api/veiculos`);
                v = parseList(raw, ["veiculos"]);
                cacheSet(veiculosKey, v);
            }
            setVeiculos(v);
        } catch (e) {
            // Tentar fallback de mocks locais para não quebrar a página durante o dev
            try {
                const [mMock, vMock] = await Promise.all([
                    fetch("/mock/marcas.json").then((r) => r.json()),
                    fetch("/mock/veiculos.json").then((r) => r.json()),
                ]);
                setMarcas(Array.isArray(mMock) ? mMock : []);
                setVeiculos(Array.isArray(vMock) ? vMock : []);
                setError("Usando dados de exemplo (API falhou)");
            } catch (_) {
                setError((e && (e.message || e.status)) ? `${e.message}${e.body ? ` - ${e.body}` : ""}` : "Falha ao carregar dados");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

    }, []);

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Loja de Veículos</h1>
            {error && <p style={{ color: "crimson" }}>Erro: {error}</p>}
            {loading ? (
                <p>Carregando...</p>
            ) : (
                <>
                    <section>
                        <h2>Marcas</h2>
                        {Array.isArray(marcas) && marcas.length ? (
                            <ul>
                                {marcas.map((m) => (
                                    <li key={m.id || m._id || m.nome}>{m.nome || m.name || "(sem nome)"}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>Nenhuma marca encontrada.</p>
                        )}
                    </section>

                    <section style={{ marginTop: 16 }}>
                        <h2>Veículos</h2>
                        {Array.isArray(veiculos) && veiculos.length ? (
                            <ul>
                                {veiculos.map((v) => (
                                    <li key={v.id || v._id || `${v.marca}-${v.modelo}-${v.placa || v.chassi || Math.random()}` }>
                                        <strong>{v.modelo || v.nome || "(sem modelo)"}</strong>
                                        {" "}- {v.marca || v.marcaNome || "(sem marca)"}
                                        {v.ano ? ` - ${v.ano}` : ""}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Nenhum veículo encontrado.</p>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
