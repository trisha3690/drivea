import React, { useState } from 'react'
import { useDrive } from '../../hooks/useDrive'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

const CreateFolderModal = ({isOpen, onClose}) => {
    const [name, setName] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { createFolder } = useDrive()

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            const created = await createFolder(name.trim());
            if (created) {
                setName("");
                onClose();
            }
        } finally {
            setIsLoading(false);
        }
    }


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Folder">
        <form className="space-y-4" onSubmit={handleSubmit}>
            <Input label="Folder Name"
            placeholder="Untitled Folder"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            autoFocus required/>

            <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={onClose} type="button">
                    Cancel
                </Button>

                <Button variant="primary" type="submit"
                disabled={!name.trim()} isLoading={isLoading}>
                    Create
                </Button>
            </div>
        </form>
    </Modal>
  )
}

export default CreateFolderModal