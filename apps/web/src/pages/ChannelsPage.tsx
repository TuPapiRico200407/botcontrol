import React, { useEffect, useState } from 'react';
import { useApi } from '../utils/api';
import { Button, Card, DataTable, Spinner, Modal, ChannelForm, Badge, ChannelFormData } from '@botcontrol/ui';

interface ChannelRow {
    [key: string]: unknown;
    id: string;
    is_active: boolean;
    verified_at: string;
    phone_number: string;
    phone_number_id: string;
}

export function ChannelsPage({ orgId }: { orgId: string }) {
    const api = useApi();
    const [channels, setChannels] = useState<ChannelRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadChannels();
    }, [orgId]);

    const loadChannels = async () => {
        setIsLoading(true);
        const { data, error: fetchErr } = await api.getChannels(orgId);
        setIsLoading(false);
        if (fetchErr) {
            setError(fetchErr.message);
        } else if (data?.data) {
            setChannels(data.data as ChannelRow[]);
        }
    };

    const handleCreate = async (formData: ChannelFormData) => {
        setIsSubmitting(true);
        setError(null);
        const { error: submitErr } = await api.createChannel(orgId, formData);
        setIsSubmitting(false);

        if (submitErr) {
            setError(submitErr.message);
        } else {
            setIsModalOpen(false);
            loadChannels();
        }
    };

    const handleDelete = async (channelId: string) => {
        if (!window.confirm('Are you sure you want to deactivate this channel?')) return;

        setIsLoading(true);
        const { error: delErr } = await api.deleteChannel(orgId, channelId);
        setIsLoading(false);

        if (delErr) {
            setError(delErr.message);
        } else {
            loadChannels();
        }
    };

    if (isLoading && channels.length === 0) return <Spinner />;

    const columns = [
        { key: 'phone', header: 'Phone Number', accessor: 'phone_number' },
        { key: 'waba', header: 'WhatsApp ID', accessor: 'phone_number_id' },
        {
            key: 'status',
            header: 'Status',
            accessor: (row: ChannelRow) => (
                <Badge variant={row.is_active ? 'success' : 'default'}>
                    {row.is_active ? 'Active' : 'Inactive'}
                </Badge>
            )
        },
        { key: 'verified', header: 'Verified At', accessor: (row: ChannelRow) => new Date(row.verified_at).toLocaleDateString() },
        {
            key: 'actions',
            header: 'Actions',
            accessor: (row: ChannelRow) => (
                <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(row.id)}
                    disabled={!row.is_active}
                >
                    Deactivate
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">WhatsApp Channels</h2>
                <Button onClick={() => setIsModalOpen(true)}>
                    Connect WhatsApp
                </Button>
            </div>

            {error && (
                <div className="p-3 bg-red-900 border border-red-700 text-red-200 rounded">
                    {error}
                </div>
            )}

            <Card>
                <DataTable columns={columns} data={channels} />
            </Card>

            {isModalOpen && (
                <Modal title="Connect WhatsApp Channel" onClose={() => setIsModalOpen(false)}>
                    <ChannelForm onSubmit={handleCreate} isLoading={isSubmitting} />
                </Modal>
            )}
        </div>
    );
}
