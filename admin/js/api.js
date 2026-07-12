const API = {

    async getEvents() {

        const response = await fetch("/api/admin/events");

        if (!response.ok)
            throw new Error("Ошибка загрузки событий");

        return response.json();

    },

    async createEvent(data) {

        const response = await fetch("/api/admin/events", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)

        });

        if (!response.ok)
            throw new Error("Ошибка создания");

        return response.json();

    },

    async updateEvent(id, data) {

        const response = await fetch(`/api/admin/events/${id}`, {

            method: "PUT",

            headers: {
                "Content-Type":"application/json"
            },

            body: JSON.stringify(data)

        });

        if (!response.ok)
            throw new Error("Ошибка изменения");

        return response.json();

    },

    async deleteEvent(id){

        const response = await fetch(`/api/admin/events/${id}`,{

            method:"DELETE"

        });

        if(!response.ok)
            throw new Error("Ошибка удаления");

    }

}