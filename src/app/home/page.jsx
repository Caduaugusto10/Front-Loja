"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Pagination, Modal, Card, Skeleton } from "antd";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "antd/dist/reset.css";
import styles from "./Home.module.css";

// Config: use NEXT_PUBLIC_API_URL ou NEXT_PUBLIC_API_BASE_URL, senão usa rewrites e chama "/api/..."
const BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "";

const api = (path) => (BASE ? `${BASE}${path}` : path);

const asArray = (data, altKeys = []) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
        for (const k of ["data", "items", "rows", "result", "results", ...altKeys]) {
            if (Array.isArray(data[k])) return data[k];
        }
    }
    return [];
};

export default function Home() {
    const [marcas, setMarcas] = useState([]);
    const [veiculos, setVeiculos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ open: false, item: null });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [m, v] = await Promise.all([
                    axios.get(api("/api/marcas"), { timeout: 15000 }),
                    axios.get(api("/api/veiculos"), { timeout: 15000 }),
                ]);
                setMarcas(asArray(m.data, ["marcas"]));
                setVeiculos(asArray(v.data, ["veiculos"]));
            } catch (e) {
                console.error(e);
                toast.error("Erro ao carregar marcas/veículos");
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const pageData = () => {
        const start = (page - 1) * pageSize;
        return veiculos.slice(start, start + pageSize);
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Marcas e Veículos</h1>
            <ToastContainer position="top-right" autoClose={4500} />

            {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
                <>
                    <section className={styles.section}>
                        <h2 className={styles.subtitle}>Marcas</h2>
                        {marcas.length ? (
                            <ul className={styles.list}>
                                {marcas.map((m) => (
                                    <li key={m.id || m._id || m.nome}>{m.nome || m.name || "(sem nome)"}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>Nenhuma marca encontrada.</p>
                        )}
                    </section>

                    <section className={styles.section}>
                        <div className={styles.headerRow}>
                            <h2 className={styles.subtitle}>Veículos</h2>
                            <Pagination
                                current={page}
                                pageSize={pageSize}
                                total={veiculos.length}
                                onChange={(p, s) => {
                                    setPage(p);
                                    setPageSize(s);
                                }}
                                showSizeChanger
                                pageSizeOptions={["8", "12", "24"]}
                            />
                        </div>

                        {veiculos.length ? (
                            <div className={styles.cardsContainer}>
                                {pageData().map((v) => (
                                    <Card
                                        key={v.id || v._id || `${v.marca}-${v.modelo}-${v.placa || v.chassi}`}
                                        className={styles.card}
                                        hoverable
                                        onClick={() => setModal({ open: true, item: v })}
                                        title={`${v.modelo || v.nome || "(sem modelo)"}`}
                                    >
                                        <p>
                                            <strong>Marca:</strong> {v.marca || v.marcaNome || "-"}
                                        </p>
                                        {v.ano && (
                                            <p>
                                                <strong>Ano:</strong> {v.ano}
                                            </p>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p>Nenhum veículo encontrado.</p>
                        )}
                    </section>

                    <Modal
                        title={modal.item ? `${modal.item.marca || "Marca"} • ${modal.item.modelo || "Modelo"}` : "Detalhes"}
                        open={modal.open}
                        onCancel={() => setModal({ open: false, item: null })}
                        onOk={() => setModal({ open: false, item: null })}
                        width={600}
                    >
                        {modal.item ? (
                            <div>
                                <p>
                                    <strong>Marca:</strong> {modal.item.marca || modal.item.marcaNome || "-"}
                                </p>
                                <p>
                                    <strong>Modelo:</strong> {modal.item.modelo || modal.item.nome || "-"}
                                </p>
                                {modal.item.ano && (
                                    <p>
                                        <strong>Ano:</strong> {modal.item.ano}
                                    </p>
                                )}
                                {modal.item.placa && (
                                    <p>
                                        <strong>Placa:</strong> {modal.item.placa}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p>Sem dados.</p>
                        )}
                    </Modal>
                </>
            )}
        </div>
    );
}