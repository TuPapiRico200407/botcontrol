import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useApi } from '../utils/api';
import { Modal, Button, Input, Spinner } from '@botcontrol/ui';
export function CreateOrgModal({ onClose, onSuccess }) {
    const api = useApi();
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e?.preventDefault();
        setError(null);
        if (!name.trim()) {
            setError('Organization name is required');
            return;
        }
        if (!slug.trim()) {
            setError('Organization slug is required');
            return;
        }
        setLoading(true);
        const { data, error: apiError } = await api.createOrg(name, slug);
        setLoading(false);
        if (apiError) {
            setError(apiError.message);
            return;
        }
        onSuccess(data);
    };
    return (_jsx(Modal, { title: "Create Organization", onClose: onClose, children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsx(Input, { id: "name", label: "Organization Name", type: "text", placeholder: "Acme Inc", value: name, onChange: (e) => {
                        setName(e.target.value);
                        // Auto-generate slug from name
                        setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }, required: true }), _jsx(Input, { id: "slug", label: "Organization Slug", type: "text", placeholder: "acme-inc", value: slug, onChange: (e) => setSlug(e.target.value.toLowerCase()), required: true }), error && _jsx("p", { className: "text-sm text-red-400", children: error }), _jsxs("div", { className: "flex gap-3 justify-end", children: [_jsx(Button, { variant: "ghost", onClick: onClose, disabled: loading, children: "Cancel" }), _jsx(Button, { onClick: handleSubmit, disabled: loading, children: loading ? _jsx(Spinner, { size: "sm" }) : 'Create' })] })] }) }));
}
