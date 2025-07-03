// src/pages/MembreFamillePage.js

import React, { useState, useEffect } from 'react';
import {
  createMembre,
  getMembres,
  updateMembre,
  deleteMembre
} from '../services/membreService';

function MembreFamillePage() {
  const [membres, setMembres] = useState([]);
  const [formData, setFormData] = useState({
    nomComplet: '', // Renommé 'nom' en 'nomComplet'
    age: '',
    sexe: 'homme',
    photoProfil: '', // Renommé 'photoURL' en 'photoProfil'
    roleFamille: '', // Renommé 'role' en 'roleFamille'
    email: '', // Ajout du champ email, nécessaire pour UID fallback
    uid: '' // Ajout du champ UID
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchMembres();
  }, []);

  const fetchMembres = async () => {
    try {
      const data = await getMembres();
      setMembres(data);
    } catch (error) {
      console.error('Erreur lors du chargement des membres :', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photoProfil: reader.result })); // Stocke la chaîne Base64
      };
      reader.readAsDataURL(file);
    } else {
        setFormData((prev) => ({ ...prev, photoProfil: '' }));
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateMembre(editingId, formData);
        setEditingId(null);
      } else {
        // Pour les membres non authentifiés, on peut utiliser l'email comme UID/ID de document
        // Si vous voulez un vrai UID pour chaque membre non-utilisateur, vous devrez générer un UUID ici.
        await createMembre({ ...formData, uid: formData.email }); // Utilisez l'email comme UID par défaut si pas d'authentification Firebase
      }
      setFormData({ nomComplet: '', age: '', sexe: 'homme', photoProfil: '', roleFamille: '', email: '', uid: '' });
      fetchMembres();
    } catch (error) {
      console.error('Erreur lors de l\'opération sur le membre :', error);
    }
  };

  const handleEdit = (membre) => {
    setFormData({
      nomComplet: membre.nomComplet,
      age: membre.age,
      sexe: membre.sexe,
      photoProfil: membre.photoProfil,
      roleFamille: membre.roleFamille,
      email: membre.email,
      uid: membre.uid || ''
    });
    setEditingId(membre.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      try {
        await deleteMembre(id);
        fetchMembres();
      } catch (error) {
        console.error('Erreur lors de la suppression du membre :', error);
      }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h2>Gestion des Membres de la Famille</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
        <h3>{editingId ? 'Modifier un membre' : 'Ajouter un nouveau membre'}</h3>
        <div>
          <label htmlFor="email">Email :</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={editingId ? true : false} // Empêche la modification de l'email en édition
          />
        </div>
        <div>
          <label htmlFor="nomComplet">Nom Complet :</label>
          <input
            type="text"
            id="nomComplet"
            name="nomComplet"
            value={formData.nomComplet}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="age">Age :</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="sexe">Sexe :</label>
          <select id="sexe" name="sexe" value={formData.sexe} onChange={handleChange} required>
            <option value="homme">Homme</option>
            <option value="femme">Femme</option>
          </select>
        </div>
        <div>
          <label htmlFor="photoProfil">Photo de Profil (Base64) :</label>
          <input
            type="file" // Changé en type file
            id="photoProfil"
            name="photoProfil"
            accept="image/*"
            onChange={handlePhotoChange} // Utilise la nouvelle fonction de gestion de fichier
          />
          {formData.photoProfil && (
            <img src={formData.photoProfil} alt="Aperçu photo" style={{ width: '100px', height: '100px', objectFit: 'cover', marginTop: '10px' }} />
          )}
        </div>
        <div>
          <label htmlFor="roleFamille">Rôle (Ex: Maman, Papa, Enfant) :</label>
          <input
            type="text"
            id="roleFamille"
            name="roleFamille"
            value={formData.roleFamille}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {editingId ? 'Modifier' : 'Ajouter'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormData({ nomComplet: '', age: '', sexe: 'homme', photoProfil: '', roleFamille: '', email: '', uid: '' });
            }}
            style={{ marginLeft: '10px', padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Annuler
          </button>
        )}
      </form>

      <h3>Liste des Membres</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        {membres.length === 0 ? (
          <p>Aucun membre de la famille enregistré pour l'instant.</p>
        ) : (
          membres.map((membre) => (
            <div key={membre.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', boxShadow: '2px 2px 5px rgba(0,0,0,0.1)' }}>
              {membre.photoProfil && <img src={membre.photoProfil} alt={membre.nomComplet} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', marginBottom: '10px' }} />}
              <h4>{membre.nomComplet}</h4>
              <p>Email: {membre.email}</p>
              <p>Age: {membre.age}</p>
              <p>Sexe: {membre.sexe}</p>
              <p>Rôle: {membre.roleFamille}</p>
              <button onClick={() => handleEdit(membre)} style={{ marginRight: '10px', padding: '8px 15px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Modifier
              </button>
              <button onClick={() => handleDelete(membre.id)} style={{ padding: '8px 15px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Supprimer
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MembreFamillePage;